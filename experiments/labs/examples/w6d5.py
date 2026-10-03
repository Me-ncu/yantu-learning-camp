# 学习目标：一个合法的推理前预算选择器
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：门槛.9选择16。改成.99仍回退默认16；默认不必等于最大预算。
# 各预算必须是一条走到终点的完整采样方案
budgets = [8, 16, 32]
# 每档独立达标概率为教学假设，不互斥、也未校准
probabilities = [0.70, 0.92, 0.96]  # 教学假设，不是模型实测
# 用实际在线成本排序；此处仅使用示例毫秒
costs = [12, 21, 40]  # 教学毫秒，实际需要测量
# 门槛与默认方案在验证阶段确定
threshold, default = 0.9, 16
# enumerate同时提供下标i和概率p，保留达标下标
eligible = [i for i,p in enumerate(probabilities) if p >= threshold]
# 有候选按成本最小者选择，否则使用验证过的默认方案
chosen = budgets[min(eligible, key=lambda i: costs[i])] if eligible else default
# 这是运行恢复前的决策，未读取GT或输出质量
print("所选预算:", chosen)
# 验证教学规则；0.9门槛不保证实际错误率10%
assert chosen == 16
