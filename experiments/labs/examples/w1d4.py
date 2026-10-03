# 学习目标：用自动求导核对链式法则
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：预测7、损失9、梯度-18与-6。
# 导入自动求导库
import torch
# 权重允许记录梯度，必须使用浮点张量
w = torch.tensor(2., requires_grad=True)
# 偏置也要记录梯度
b = torch.tensor(1., requires_grad=True)
# 建立预测计算图
prediction = w * 3 + b
# 把预测误差平方，得到标量损失
loss = (prediction - 10) ** 2
# 沿计算图反向传播，梯度写入.grad
loss.backward()
# item只用于输出标量
print("预测与损失:", prediction.item(), loss.item())
# 打印权重与偏置的不同梯度
print("两个梯度:", w.grad.item(), b.grad.item())
# 核对链式法则结果；此处只反传一次无需循环清零
assert w.grad.item() == -18 and b.grad.item() == -6
