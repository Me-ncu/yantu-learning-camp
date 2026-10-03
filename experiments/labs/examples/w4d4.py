# 学习目标：从像素算PSNR
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：MSE约.01，PSNR约20dB。
# math提供对数及正无穷
import math
# 配对像素例子；负输出不裁剪，按预先约定范围计分
target, prediction = [0., 0.], [0.1, -0.1]
# 每对像素差平方再平均
error = sum((a-b)**2 for a,b in zip(target, prediction)) / len(target)
# 信号约定动态范围为1，不是临时用输出最大最小值
data_range = 1.
# 零误差特殊处理，其他按PSNR公式
score = math.inf if error == 0 else 10*math.log10(data_range**2/error)
# 查看像素误差与分贝分数
print("MSE:", error, "PSNR:", score)
# 检查预期20dB；真实图像还需配对和颜色协议
assert abs(score-20) < 1e-10
