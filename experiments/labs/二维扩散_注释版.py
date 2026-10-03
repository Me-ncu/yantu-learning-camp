"""一个可学习的最小二维扩散实验。

它不下载数据，使用 PyTorch 在四个高斯簇组成的二维分布上训练噪声预测网络。
用途是理解 x0 -> xt、epsilon prediction、反向采样和 NFE 记录。
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import time
from datetime import datetime
import hashlib
from pathlib import Path

import torch
from torch import Tensor, nn
from torch.nn import functional as F


# 教学导读：同时固定Python与PyTorch随机种子；CUDA可用时也设置，跨设备仍不保证逐位一致。
def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# 教学导读：根据cpu/cuda/auto选择设备；明确要求CUDA却不可用时立即报错，不暗中把CPU时间当GPU结果。
def choose_device(requested: str) -> torch.device:
    if requested == "cpu":
        return torch.device("cpu")
    if requested == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("请求了 CUDA，但当前 PyTorch 看不到 CUDA 设备")
        return torch.device("cuda")
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# 教学导读：输入样本数n和设备，返回形状[n,2]。四个簇中心随机分配后加标准差0.35的噪声，不是图像数据集。
def make_data(n: int, device: torch.device) -> Tensor:
    centers = torch.tensor(
        [[-2.0, -2.0], [-2.0, 2.0], [2.0, -2.0], [2.0, 2.0]],
        device=device,
    )
    labels = torch.randint(0, len(centers), (n,), device=device)
    return centers[labels] + 0.35 * torch.randn(n, 2, device=device)


# 教学导读：beta从0.0001到0.02，alpha=1-beta，累计乘积得到alpha_bar；训练与采样必须复用同一约定。
def make_schedule(timesteps: int, device: torch.device) -> dict[str, Tensor]:
    betas = torch.linspace(1e-4, 0.02, timesteps, device=device)
    alphas = 1.0 - betas
    alpha_bar = torch.cumprod(alphas, dim=0)
    return {"alpha_bar": alpha_bar}


# 教学导读：按每个样本的时间索引取对应系数，再变成[B,1]，以便广播到[B,2]坐标。
def extract(values: Tensor, t: Tensor) -> Tensor:
    return values[t].view(-1, 1)


# 教学导读：按sqrt(alpha_bar)*x0+sqrt(1-alpha_bar)*noise构造带噪输入，x0与noise都是[B,2]。
def q_sample(x0: Tensor, t: Tensor, noise: Tensor, schedule: dict[str, Tensor]) -> Tensor:
    alpha_bar_t = extract(schedule["alpha_bar"], t)
    return alpha_bar_t.sqrt() * x0 + (1.0 - alpha_bar_t).sqrt() * noise


# 教学导读：把整数时间变成归一化时间及正余弦三维特征，输出[B,3]；这是简单时间编码，不是完整Transformer。
def time_features(t: Tensor, timesteps: int) -> Tensor:
    scaled = t.float() / float(timesteps)
    return torch.stack(
        [scaled, torch.sin(2.0 * torch.pi * scaled), torch.cos(2.0 * torch.pi * scaled)],
        dim=1,
    )


# 教学导读：噪声预测器：二维坐标与三维时间特征拼成5维输入，经MLP输出二维噪声。没有图像卷积。
class Denoiser(nn.Module):
    # 教学导读：建立5→128→128→2的网络，SiLU是非线性激活；super初始化PyTorch基类所需状态。
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(5, 128),
            nn.SiLU(),
            nn.Linear(128, 128),
            nn.SiLU(),
            nn.Linear(128, 2),
        )

    # 教学导读：在特征维拼接[B,2]与[B,3]为[B,5]，self.net输出[B,2]。返回噪声预测而非直接返回干净坐标。
    def forward(self, x: Tensor, t: Tensor, timesteps: int) -> Tensor:
        features = torch.cat([x, time_features(t, timesteps)], dim=1)
        return self.net(features)


# 教学导读：每轮生成干净坐标、随机时间和噪声，构造xt，用预测噪声与实际加入噪声的MSE训练。zero_grad→backward→step构成更新闭环。
def train_model(
    model: Denoiser,
    schedule: dict[str, Tensor],
    device: torch.device,
    timesteps: int,
    train_steps: int,
    batch_size: int,
    learning_rate: float,
) -> list[float]:
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    model.train()
    losses: list[float] = []
    for step in range(train_steps):
        x0 = make_data(batch_size, device)
        t = torch.randint(0, timesteps, (batch_size,), device=device)
        noise = torch.randn_like(x0)
        xt = q_sample(x0, t, noise, schedule)
        prediction = model(xt, t, timesteps)
        loss = F.mse_loss(prediction, noise)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()
        losses.append(float(loss.detach().cpu()))
        if (step + 1) % max(1, train_steps // 5) == 0:
            print(f"train step {step + 1:>5}/{train_steps}, loss={losses[-1]:.6f}")
    return losses


# 教学导读：GPU异步执行；计时边界必须同步。CPU时不做额外操作。
def sync_if_cuda(device: torch.device) -> None:
    if device.type == "cuda":
        torch.cuda.synchronize(device)


@torch.inference_mode()
# 教学导读：从高斯样本开始走完整稀疏日程。先预测噪声并估计x0，再更新到下一时间；最后直接到干净端点。去重后真实NFE可能不等于请求步数。
def ddim_like_sample(
    model: Denoiser,
    schedule: dict[str, Tensor],
    device: torch.device,
    timesteps: int,
    sample_steps: int,
    sample_count: int,
) -> tuple[Tensor, int, float]:
    time_grid = torch.linspace(timesteps - 1, 0, sample_steps, device=device).round().long()
    time_grid = torch.unique_consecutive(time_grid)
    x = torch.randn(sample_count, 2, device=device)
    sync_if_cuda(device)
    start = time.perf_counter()
    for index, t_value in enumerate(time_grid):
        t = torch.full((sample_count,), int(t_value.item()), device=device, dtype=torch.long)
        noise_prediction = model(x, t, timesteps)
        alpha_bar_t = schedule["alpha_bar"][t_value]
        x0_prediction = (x - (1.0 - alpha_bar_t).sqrt() * noise_prediction) / alpha_bar_t.sqrt()
        if index == len(time_grid) - 1:
            x = x0_prediction
            continue
        previous_t = time_grid[index + 1]
        alpha_bar_previous = schedule["alpha_bar"][previous_t]
        x = alpha_bar_previous.sqrt() * x0_prediction + (1.0 - alpha_bar_previous).sqrt() * noise_prediction
    sync_if_cuda(device)
    elapsed = time.perf_counter() - start
    return x.detach().cpu(), int(len(time_grid)), elapsed


# 教学导读：把坐标张量脱离梯度并移到CPU，写成可检查的CSV；保存时间不算采样模型时间。
def save_csv(path: Path, values: Tensor) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["x", "y"])
        writer.writerows(values.tolist())


# 教学导读：解析配置，训练或加载带时间步身份的权重，固定sample-seed逐预算预热与重复采样；输出只证明二维教学流程，不证明真实图像恢复效果。
def main() -> None:
    parser = argparse.ArgumentParser(description="最小二维扩散采样实验")
    parser.add_argument("--train-steps", type=int, default=1000)
    parser.add_argument("--sample-steps", type=int, nargs="+", default=[20])
    parser.add_argument("--seed", type=int, default=20260920)
    parser.add_argument("--timesteps", type=int, default=1000)
    parser.add_argument("--checkpoint", type=Path, default=None)
    parser.add_argument("--sample-seed", type=int, default=12345)
    parser.add_argument("--repeats", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=512)
    parser.add_argument("--n-samples", type=int, default=512)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    args = parser.parse_args()

    if min(args.train_steps, args.timesteps, args.batch_size, args.n_samples, args.repeats) < 1:
        parser.error("所有数量必须为正数")
    if any(s < 2 or s > args.timesteps for s in args.sample_steps):
        parser.error("采样步数必须介于 2 和 timesteps 之间")
    torch.set_num_threads(2)

    set_seed(args.seed)
    device = choose_device(args.device)
    output_dir = Path(__file__).resolve().parent / "outputs" / "toy_diffusion" / datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    output_dir.mkdir(parents=True, exist_ok=False)

    schedule = make_schedule(args.timesteps, device)
    terminal = float(schedule["alpha_bar"][-1])
    if terminal > 0.001:
        raise ValueError(f"终端 alpha_bar={terminal:.6f} 过大，不能近似纯高斯；请使用默认 timesteps=1000")
    model = Denoiser().to(device)
    print(f"device={device}, seed={args.seed}, timesteps={args.timesteps}")
    losses = [] if args.checkpoint else train_model(
        model,
        schedule,
        device,
        args.timesteps,
        args.train_steps,
        args.batch_size,
        learning_rate=1e-3,
    )
    if args.checkpoint:
        state = torch.load(args.checkpoint, map_location=device, weights_only=True)
        if state["timesteps"] != args.timesteps:
            raise ValueError("权重训练日程与采样日程不一致")
        model.load_state_dict(state["model"])

    with (output_dir / "loss.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["train_step", "loss"])
        writer.writerows(enumerate(losses, start=1))

    summary = {
        "seed": args.seed,
        "device": str(device),
        "timesteps": args.timesteps,
        "train_steps": len(losses),
        "loaded_checkpoint": str(args.checkpoint.resolve()) if args.checkpoint else None,
        "loaded_checkpoint_sha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest() if args.checkpoint else None,
        "last_loss": losses[-1] if losses else None,
        "terminal_alpha_bar": terminal,
        "torch": torch.__version__,
        "sample_seed": args.sample_seed,
        "timing_scope": "model-loop only; excludes initialization, CPU transfer and saving",
        "runs": [],
    }
    model.eval()
    for requested_steps in args.sample_steps:
        set_seed(args.sample_seed)
        ddim_like_sample(model, schedule, device, args.timesteps, requested_steps, args.n_samples)
        timings = []
        for repeat in range(args.repeats):
            set_seed(args.sample_seed)
            samples, nfe, elapsed = ddim_like_sample(
                model, schedule, device, args.timesteps, requested_steps, args.n_samples
            )
            timings.append(elapsed)
        save_csv(output_dir / f"samples_requested_{requested_steps}.csv", samples)
        summary["runs"].append(
            {
                "requested_sample_steps": requested_steps,
                "actual_nfe": nfe,
                "sampling_seconds": elapsed,
                "raw_seconds": timings,
                "median_seconds": sorted(timings)[len(timings)//2],
                "sample_mean": samples.mean(dim=0).tolist(),
                "sample_std": samples.std(dim=0).tolist(),
            }
        )
        print(f"requested={requested_steps}, actual_nfe={nfe}, seconds={elapsed:.4f}")

    torch.save({"model": model.state_dict(), "timesteps": args.timesteps}, output_dir / "model_state.pt")
    summary["checkpoint_sha256"] = hashlib.sha256((output_dir / "model_state.pt").read_bytes()).hexdigest()
    with (output_dir / "summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)
    print(f"输出目录: {output_dir}")


if __name__ == "__main__":
    main()
