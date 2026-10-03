# 学习目标：完整训练一个线性模型
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：损失很小，x=2预测接近8；这是教学线性关系，不证明真实任务泛化。
# 导入PyTorch
import torch
# 固定初始化随机种子，不能保证跨硬件逐位一致
torch.manual_seed(7)
# 限制CPU线程，避免小任务启动过多线程
torch.set_num_threads(2)
# 一输入一输出的线性层，内部有权重和偏置
model = torch.nn.Linear(1, 1)
# SGD为随机梯度下降优化器，管理参数更新
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
# 32个输入排成32×1，第一维是样本
x = torch.linspace(-1, 1, 32).reshape(-1, 1)
# 按已知直线构造教学标签
y = 3 * x + 2
# 设置训练模式；本线性层无Dropout，但保留规范
model.train()
# 运行200次参数更新，不是200张新图
for step in range(200):
    # 清空上一轮梯度，防止无意累积
    optimizer.zero_grad()
    # 前向预测后取平均平方误差
    loss = ((model(x) - y) ** 2).mean()
    # 计算当前损失对参数的梯度
    loss.backward()
    # 沿负梯度更新参数
    optimizer.step()
# 切到评估模式；不等于关闭梯度记录
model.eval()
# 上下文范围内不记录反向传播图
with torch.inference_mode():
    # 用形状1×1的输入做一次推理
    prediction = model(torch.tensor([[2.]]))
# 这里loss是最后一次更新前的训练损失
print("最终训练损失:", loss.item())
# 查看训练范围外x=2的教学预测
print("x=2的预测:", prediction.item())
# 验证已知直线结果，不作为真实模型泛化证据
assert abs(prediction.item() - 8) < 0.01
