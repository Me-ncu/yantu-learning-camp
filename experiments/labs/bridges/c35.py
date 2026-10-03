from pathlib import Path  # 相对输出位置明确绑定脚本目录。
import pandas as pd  # DataFrame组织小表格。
import matplotlib  # 无界面运行使用非交互后端。
matplotlib.use("Agg")  # 必须在导入pyplot前设置。
import matplotlib.pyplot as plt
df = pd.DataFrame({"group": ["A", "A", "B"], "loss": [1., 3., 2.]})
assert df.groupby("group")["loss"].mean().to_dict() == {"A": 2., "B": 2.}
fig, ax = plt.subplots()  # 画布与坐标轴分开。
ax.plot([1, 2, 3], [1., .7, .5], marker="o", label="hand-made")
ax.set(xlabel="epoch", ylabel="loss", title="Teaching values, not measured training")
ax.legend()  # 说明曲线身份，不能伪装实测。
target = Path(__file__).with_name("teaching_curve.svg")
fig.savefig(target)  # 保存到脚本旁，不写入原始数据。
plt.close(fig)  # 释放图形资源。
print(target.name)
