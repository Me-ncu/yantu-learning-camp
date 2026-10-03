import unittest  # Python标准库，不要求额外安装pytest。
def mean(values):
    if not values:  # 明确空输入约定。
        return None
    if not all(isinstance(x, (int, float)) for x in values):
        raise TypeError("只接受数值")  # 拒绝坏输入，不返回假成绩。
    return sum(values) / len(values)

class MeanTests(unittest.TestCase):
    def test_normal(self):
        self.assertEqual(mean([1, 3]), 2)
    def test_empty(self):
        self.assertIsNone(mean([]))
    def test_invalid(self):
        with self.assertRaises(TypeError):
            mean(["bad"])

if __name__ == "__main__":
    unittest.main()  # 自动发现并运行本文件的三条测试。
