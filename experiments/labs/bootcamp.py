"""十六周训练营：可离线运行的CPU教学项目，不下载数据或模型。

Anaconda Prompt: python -X utf8 labs\bootcamp.py --week 10
每次输出到独立目录，不覆盖旧结果。--output用于自行指定结果父目录。
请先找对应week函数读注释，再只改一个变量做对照。
这里没有大模型权重、付费API、外部代码执行或真实业务成绩。
"""
import argparse
import csv
import json
import math
from pathlib import Path
import platform
import statistics
import time
import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import DataLoader, TensorDataset


def week1(out, seed):
    """列表清洗、空输入约定与UTF-8文件往返。"""
    def nonnegative_mean(values):
        # 新建列表，不在遍历原列表时删除；空列表没有可定义的均值。
        kept = [x for x in values if x >= 0]
        return sum(kept) / len(kept) if kept else None

    original = [2, -1, 4]
    assert nonnegative_mean(original) == 3
    assert nonnegative_mean([]) is None
    assert original == [2, -1, 4]
    with (out / 'samples.csv').open('w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['样本', '数值'])
        writer.writerows(enumerate(original))
    with (out / 'samples.csv').open(encoding='utf-8', newline='') as file:
        rows = list(csv.DictReader(file))
    assert len(rows) == 3
    return dict(mean=3, empty=None, csv_rows=len(rows), checks=4)


def week2(out, seed):
    """广播和矩阵乘法使用不同规则；断言是可执行的形状说明。"""
    a = torch.tensor([[1], [2]])
    b = torch.tensor([10, 20, 30])
    broadcast = a + b
    assert broadcast.tolist() == [[11, 21, 31], [12, 22, 32]]
    weight = torch.tensor([[1., 2.], [0., 1.]])
    y = weight @ torch.tensor([3., 4.]) + torch.tensor([1., 0.])
    assert y.tolist() == [12., 4.]
    image = torch.arange(18).reshape(2, 3, 3)  # HWC布局。
    chw = image.permute(2, 0, 1)  # 交换轴，像素身份保持不变。
    assert chw[2, 0, 1] == image[0, 1, 2]
    return dict(broadcast=broadcast.tolist(), linear=y.tolist(), chw=list(chw.shape))


def week3(out, seed):
    """双精度有限差分验证自动求导；两者都不自动更新参数。"""
    errors = []
    for initial in [1., 2.]:
        w = torch.tensor(initial, dtype=torch.float64, requires_grad=True)
        loss = (2 * w - 3).square()
        loss.backward()
        h = 1e-5
        difference = (((2*(initial+h)-3)**2)-((2*(initial-h)-3)**2))/(2*h)
        errors.append(abs(w.grad.item() - difference))
    assert max(errors) < 1e-5
    return dict(gradient_errors=errors, cross_entropy_08=-math.log(.8))


def week4(out, seed):
    """分组拆分、训练统计量与逻辑回归基线。合成数据只检验流程。"""
    # 每个组两行，组身份可检验，禁止同组跨集合。
    groups = torch.arange(60).repeat_interleave(2)
    x = torch.randn(120, 2)
    y = (x[:, 0] + .5*x[:, 1] > 0).long()
    train, valid, test = groups < 40, (groups >= 40) & (groups < 50), groups >= 50
    assert set(groups[train].tolist()).isdisjoint(groups[test].tolist())
    mean, std = x[train].mean(0), x[train].std(0).clamp_min(1e-6)
    z = (x-mean)/std  # 验证和测试只使用训练集统计量。
    model = nn.Linear(2, 2)
    optimizer = torch.optim.SGD(model.parameters(), lr=.2)
    for _ in range(100):
        optimizer.zero_grad()
        F.cross_entropy(model(z[train]), y[train]).backward()
        optimizer.step()
    model.eval()
    with torch.inference_mode():
        pred = model(z[test]).argmax(1)
        acc = (pred == y[test]).float().mean().item()
        confusion = [[int(((y[test] == i) & (pred == j)).sum()) for j in range(2)] for i in range(2)]
        valid_acc = (model(z[valid]).argmax(1) == y[valid]).float().mean().item()
    return dict(train_rows=int(train.sum()), valid_rows=int(valid.sum()), test_rows=int(test.sum()),
                test_accuracy=acc, validation_accuracy=valid_acc, confusion_true_rows=confusion,
                train_mean=mean.tolist(), limitation='合成独立特征，仅验证分组与训练流程')


def train_classifier(model, x, y, epochs=60):
    """共用训练循环：每批先清梯度，按样本数加权汇总loss。"""
    loader = DataLoader(TensorDataset(x, y), batch_size=16, shuffle=True, num_workers=0)
    optimizer = torch.optim.Adam(model.parameters(), lr=.02)
    history = []
    for _ in range(epochs):
        model.train()
        total = 0.
        for inputs, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = F.cross_entropy(model(inputs), labels)
            assert torch.isfinite(loss), '首次出现非有限loss，请检查输入或学习率'
            loss.backward()
            optimizer.step()
            total += loss.item() * len(inputs)
        history.append(total/len(x))
    return history


def week5(out, seed):
    """完整DataLoader训练加独立验证，不把验证梯度用于更新。"""
    x = torch.randn(96, 4)
    y = (x[:, 0] - x[:, 1] > 0).long()
    model = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 2))
    before = model[0].weight.detach().clone()
    history = train_classifier(model, x[:64], y[:64], epochs=25)
    model.eval()
    with torch.inference_mode():
        acc = (model(x[64:]).argmax(1) == y[64:]).float().mean().item()
    change = (model[0].weight-before).abs().max().item()
    assert change > 0
    return dict(loss_curve=history, validation_accuracy=acc, max_weight_change=change)


def week6(out, seed):
    """XOR只检验非线性表达与优化，不声称真实泛化。"""
    x = torch.tensor([[0.,0.],[0.,1.],[1.,0.],[1.,1.]])
    y = torch.tensor([0, 1, 1, 0])
    model = nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 2))
    history = train_classifier(model, x, y, epochs=150)
    model.eval()
    with torch.inference_mode():
        predictions = model(x).argmax(1).tolist()
    return dict(loss_curve=history, predictions=predictions, targets=y.tolist(),
                parameters=sum(p.numel() for p in model.parameters()), limitation='4个教学点，无独立测试')


def week7(out, seed):
    """小CNN学习横/竖条纹。训练与测试使用不同生成噪声。"""
    def generate(n):
        labels = torch.arange(n) % 2
        images = torch.zeros(n, 1, 8, 8)
        for i, label in enumerate(labels):
            if label == 0:
                images[i, 0, ::2, :] = 1  # 横条纹。
            else:
                images[i, 0, :, ::2] = 1  # 竖条纹。
        return images + .2*torch.randn_like(images), labels

    x, y = generate(64)
    xt, yt = generate(32)
    model = nn.Sequential(nn.Conv2d(1, 4, 3, padding=1), nn.ReLU(), nn.Flatten(), nn.Linear(256, 2))
    history = train_classifier(model, x, y, epochs=12)
    model.eval()
    with torch.inference_mode():
        logits = model(xt)
        pred = logits.argmax(1)
    assert list(logits.shape) == [32, 2]
    # 可在工作台查看的SVG仅画输入，不伪称真实恢复输出。
    pixels = ''.join(f'<rect x="{c*20}" y="{r*20}" width="20" height="20" fill="rgb({int(255*float(xt[0,0,r,c].clamp(0,1)))},100,130)"/>' for r in range(8) for c in range(8))
    (out/'sample.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">'+pixels+'</svg>', encoding='utf-8')
    return dict(loss_curve=history, test_accuracy=(pred==yt).float().mean().item(),
                failed_indices=(pred!=yt).nonzero().flatten().tolist(), limitation='合成条纹，不能替代真实视觉评测')


def week8(out, seed):
    """保存/重载自己生成的state_dict；不加载外来pickle。"""
    model = nn.Linear(4, 2).eval()
    x = torch.randn(3, 4)
    torch.save(model.state_dict(), out/'weights.pt')
    restored = nn.Linear(4, 2).eval()
    restored.load_state_dict(torch.load(out/'weights.pt', map_location='cpu', weights_only=True))
    with torch.inference_mode():
        error = (model(x)-restored(x)).abs().max().item()
    assert error == 0
    return dict(reload_max_error=error, scope='仅推理恢复，不包含优化器/RNG续训恢复')


def attention(q, k, v, causal=True):
    """显式加性掩码避免不同API布尔mask语义混淆。输入[B,T,D]。"""
    scores = q @ k.transpose(-2, -1) / math.sqrt(q.shape[-1])
    if causal:
        # 上三角为未来位置；填负无穷后softmax权重为0。
        future = torch.ones(scores.shape[-2:], dtype=torch.bool).triu(1)
        scores = scores.masked_fill(future, float('-inf'))
    weights = scores.softmax(-1)
    return weights @ v, weights


def week9(out, seed):
    q, k, v = (torch.randn(1, 4, 8) for _ in range(3))
    output, weights = attention(q, k, v)
    assert torch.allclose(weights.sum(-1), torch.ones(1, 4))
    assert weights.triu(1).abs().max() == 0
    # 修改未来位置，第一位置不应变化。
    k2, v2 = k.clone(), v.clone()
    k2[:, 1:] += 100
    v2[:, 1:] -= 100
    modified, _ = attention(q, k2, v2)
    assert torch.allclose(output[:, 0], modified[:, 0])
    return dict(attention=weights[0].tolist(), future_weight_max=0, prefix_invariance=True)


class TinyLanguageModel(nn.Module):
    """一层Pre-LN单头因果Transformer；用于理解，不是可用LLM。"""
    def __init__(self, vocab=4, width=16, length=16):
        super().__init__()
        self.token = nn.Embedding(vocab, width)
        self.position = nn.Embedding(length, width)
        self.norm1, self.norm2 = nn.LayerNorm(width), nn.LayerNorm(width)
        self.qkv = nn.Linear(width, 3*width)
        self.project = nn.Linear(width, width)
        self.ff = nn.Sequential(nn.Linear(width, 2*width), nn.GELU(), nn.Linear(2*width, width))
        self.head = nn.Linear(width, vocab)

    def forward(self, ids):
        # 广播位置嵌入到批量维，得到[B,T,D]。
        x = self.token(ids) + self.position(torch.arange(ids.shape[1]))
        q, k, v = self.qkv(self.norm1(x)).chunk(3, dim=-1)
        mixed, _ = attention(q, k, v)
        x = x + self.project(mixed)  # 第一条残差路径。
        x = x + self.ff(self.norm2(x))  # 逐位置非线性，不混合未来位置。
        return self.head(x)


def week10(out, seed):
    # 自编循环字符ABCD；每行17个token，前16输入，后16目标。
    starts = torch.randint(0, 4, (32, 1))
    stream = (starts + torch.arange(17)) % 4
    x, targets = stream[:, :-1], stream[:, 1:]
    model = TinyLanguageModel()
    optimizer = torch.optim.Adam(model.parameters(), lr=.01)
    curve = []
    for _ in range(60):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        logits = model(x)
        loss = F.cross_entropy(logits.reshape(-1, 4), targets.reshape(-1))
        loss.backward()
        optimizer.step()
        curve.append(loss.item())
    model.eval()
    with torch.inference_mode():
        changed = x.clone()
        changed[:, 8:] = (changed[:, 8:] + 1) % 4
        error = (model(x)[:, :8]-model(changed)[:, :8]).abs().max().item()
        assert error < 1e-6
        generated = torch.tensor([[0]])
        temperature = .8  # 修改此值比较采样，不表示事实可信度。
        for _ in range(15):
            probabilities = (model(generated)[:, -1]/temperature).softmax(-1)
            next_id = torch.multinomial(probabilities, 1)
            generated = torch.cat([generated, next_id], dim=1)
    assert curve[-1] < curve[0]
    return dict(loss_curve=curve, generated=''.join('ABCD'[i] for i in generated[0].tolist()),
                prefix_max_error=error, parameters=sum(p.numel() for p in model.parameters()),
                limitation='自编重复字符教学语料，无真实语言或事实能力，未使用预训练LLM')


def week11(out, seed):
    """线性LoRA机制：冻结W，训练A/B，再验证合并等价。"""
    x = torch.randn(64, 8)
    base = torch.randn(4, 8)
    original = base.clone()
    target_weight = base + .1*torch.randn(4, 8)
    target = x @ target_weight.T
    rank, alpha = 2, 2
    a = nn.Parameter(torch.randn(rank, 8)*.1)
    b = nn.Parameter(torch.zeros(4, rank))  # 初始增量0，不改变基础输出。
    optimizer = torch.optim.Adam([a, b], lr=.03)
    curve = []
    for _ in range(100):
        optimizer.zero_grad(set_to_none=True)
        prediction = x @ base.T + (alpha/rank)*(x @ a.T @ b.T)
        loss = F.mse_loss(prediction, target)
        loss.backward()
        optimizer.step()
        curve.append(loss.item())
    with torch.inference_mode():
        separate = x @ base.T + (alpha/rank)*(x @ a.T @ b.T)
        merged = x @ (base + (alpha/rank)*b@a).T
        error = (separate-merged).abs().max().item()
    assert torch.equal(base, original) and b.abs().sum() > 0 and error < 1e-5
    return dict(loss_curve=curve, trainable_parameters=a.numel()+b.numel(), merge_max_error=error,
                frozen_unchanged=True, limitation='线性教学LoRA，未执行预训练LLM微调')


def week12(out, seed):
    """确定性字符二元组检索与原句返回；不是生成式RAG。"""
    docs = {'d1':'训练时先清空梯度再反向传播。','d2':'验证时不更新模型参数。','d3':'进度保存在本机，支持导出备份。'}
    def grams(text):
        return {text[i:i+2] for i in range(len(text)-1)}
    def retrieve(query):
        q = grams(query)
        scored = []
        for key, text in docs.items():
            d = grams(text)
            scored.append((len(q & d)/max(1, len(q | d)), key))
        score, key = max(scored)
        # 0.08是本教学任务预设阈值，不是校准概率或通用拒答标准。
        return {'source':key,'answer':docs[key],'score':score} if score >= .08 else {'source':None,'answer':'资料不足，拒答','score':score}
    queries = [('训练时如何清空梯度？','d1'),('验证时更新参数吗？','d2'),('进度如何备份？','d3'),('火星天气？',None)]
    results = [dict(query=q, expected=e, **retrieve(q)) for q,e in queries]
    assert results[-1]['source'] is None
    return dict(cases=results, accuracy=sum(r['source']==r['expected'] for r in results)/len(results),
                limitation='手造小测试，仅检索+原句引用，没有LLM、语义理解或已校准拒答')


def week13(out, seed):
    """离线推理接口契约，不创建公网服务。"""
    model = nn.Linear(4, 2).eval()
    def predict(x):
        if not isinstance(x, torch.Tensor) or x.ndim != 2 or x.shape[1] != 4 or len(x) == 0:
            raise ValueError('需要非空[B,4]张量')
        if not x.is_floating_point() or not torch.isfinite(x).all():
            raise ValueError('需要有限浮点数')
        with torch.inference_mode():
            return model(x)
    assert list(predict(torch.zeros(2, 4)).shape) == [2, 2]
    rejected = 0
    for bad in [torch.empty(0, 4), torch.zeros(2, 5), torch.full((2,4), float('nan'))]:
        try:
            predict(bad)
        except ValueError:
            rejected += 1
    assert rejected == 3
    return dict(valid_test=True, invalid_tests_rejected=rejected, scope='仅本地函数契约，无认证、并发或生产SLA')


def week14(out, seed):
    """加噪端点与PSNR协议的最小测试；不训练扩散骨干。"""
    clean = torch.tensor([.2, .5, .8])
    noise = torch.randn_like(clean)
    def mix(alpha):
        return math.sqrt(alpha)*clean + math.sqrt(1-alpha)*noise
    assert torch.equal(mix(1), clean) and torch.equal(mix(0), noise)
    mse = float(((clean+.1)-clean).square().mean())
    psnr = -10*math.log10(mse)
    assert abs(psnr-20) < 1e-4
    return dict(alpha064=mix(.64).tolist(), mse=mse, psnr=psnr,
                scope='教学加噪和指标，不是图像恢复或扩散模型复现')


def week15(out, seed):
    """不可部署oracle上界。质量和成本为手造，不是实测恢复。"""
    labels = [[1,1,0],[0,1,1],[0,0,1],[1,0,1]]
    costs = [12,21,40]
    selected = [min((j for j, ok in enumerate(row) if ok), key=lambda j:costs[j]) for row in labels]
    oracle = statistics.mean(costs[j] for j in selected)
    overhead = 2
    default_cost = 40
    return dict(labels=labels, selected_indices=selected, oracle_cost=oracle,
                assumed_overhead=overhead, net_cost=oracle+overhead,
                net_saving_fraction=1-(oracle+overhead)/default_cost,
                limitation='全部质量标签与ms成本为手造假设，不代表真实骨干研究空间；oracle不可部署')


def week16(out, seed):
    """结业清单不自动填成绩，所有未提交证据保持未验收。"""
    return dict(status='NEEDS_LEARNER_EVIDENCE', rubric={
        'data_card':'待提供来源、许可、分组和样本数',
        'reproduction':'待提交隔日从零重跑日志',
        'evaluation':'待提交冻结协议、真实指标和失败案例',
        'explanation':'待完成10分钟闭卷讲解',
        'limitations':'待说明教学、实测与未验证内容边界'},
        note='脚本运行不能判定毕业，不颁发认证')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--week', type=int, choices=range(1,17), required=True)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output', type=Path, default=Path(__file__).parent/'outputs')
    args = parser.parse_args()
    torch.manual_seed(args.seed)
    torch.set_num_threads(1)  # CPU小模型避免线程调度掩盖教学过程。
    out = args.output / f'weekB{args.week:02}_{time.time_ns()}'
    out.mkdir(parents=True, exist_ok=False)
    start = time.perf_counter()
    result = globals()[f'week{args.week}'](out, args.seed)
    result.update(week=args.week, seed=args.seed, python=platform.python_version(), torch=torch.__version__,
                  device='cpu', measured_wall_seconds=time.perf_counter()-start,
                  evidence='EDUCATIONAL', output=str(out.resolve()))
    (out/'metrics.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
