import numpy as np  # 导入数组工具，np只是常用别名。
a = np.array([[1., 3.], [5., 7.]])  # shape=(2,2)。
assert np.allclose(a.mean(axis=0), [3., 5.])  # 沿行轴汇总。
assert np.allclose(a.mean(axis=1), [2., 6.])  # 沿列轴汇总。
column = a[:, 0].copy()  # 明确复制，避免改变原数据。
column[:] = 0  # 只修改副本。
assert a[0, 0] == 1  # 证明原数据仍在。
print(a.mean(axis=0).tolist(), a.mean(axis=1).tolist())
