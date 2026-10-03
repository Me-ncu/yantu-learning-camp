# 学习目标：看清轴交换与广播
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：形状从[2,4,3]变[3,2,4]，同一像素值不变；广播后为[1,2,3]。
# 导入张量运算库
import torch
# 生成0到23的数并排成HWC；这里只是模拟图像
image = torch.arange(24).reshape(2, 4, 3)  # H=2, W=4, C=3
# 把轴顺序HWC改成CHW，元素位置语义随轴一起变换
chw = image.permute(2, 0, 1)
# 比较转换前后的形状
print("原始形状:", image.shape, "转换后:", chw.shape)
# 索引位置随轴变换；item把单元素张量取为Python数
print("同一像素:", image[0, 1, 2].item(), chw[2, 0, 1].item())
# 建立批量BCHW张量
batch = torch.zeros(2, 3, 4, 5)
# 三个通道偏置排成1×3×1×1，供广播使用
bias = torch.tensor([1., 2., 3.]).reshape(1, 3, 1, 1)
# 在批量及空间维扩展偏置，查看首图首像素
print("广播后首像素:", (batch + bias)[0, :, 0, 0])
# 证明对应像素没有改变
assert image[0, 1, 2] == chw[2, 0, 1]
