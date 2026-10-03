# 学习目标：确认正在使用哪个Python
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：最后一行是5；解释器路径应包含你所选环境的名称。
# 导入标准库sys，用来查看当前解释器
import sys
# 版本字符串按空格切开，取第一项版本号
print("Python版本:", sys.version.split()[0])
# executable是实际执行本文件的Python路径
print("解释器路径:", sys.executable)
# 先预测加法结果，再看终端输出
print("一个算式:", 2 + 3)
# assert检查条件，不成立时程序停止并给出行号
assert 2 + 3 == 5
