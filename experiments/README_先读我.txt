研途 · 本地实验包（不是桌面APP）

网页阅读、图示、测验和笔记不需要安装Python。此包仅用于在自己的电脑运行Python实验。
网页不连接你的终端，不接收训练数据，也不会在服务器执行代码。

1. 将ZIP解压到自己选定的目录，例如 D:\yantu-labs。
2. 打开Anaconda Prompt（不是Python的 >>> 提示符）。先查看已有环境：
   conda env list
   若已有可用环境，可以直接激活它，无需修改原环境或重装Anaconda。
3. 没有合适环境时，另建隔离环境。以下安装需要网络；不强制安装GPU版：
   conda create -n yantu-study python=3.10 -y
   conda activate yantu-study
   python -m pip install torch==2.7.0 --index-url https://download.pytorch.org/whl/cpu
   python -m pip install numpy pandas matplotlib
   这些是本课程参考配置，不是所有操作系统的保证。若找不到对应wheel，先核对PyTorch官方安装页与Python/CPU架构；不要盲目升级原科研环境。
4. 在Anaconda Prompt进入你实际的解压位置（路径只是示例）：
   cd /d "D:\yantu-labs"
   python -c "import sys,torch; print(sys.executable); print(torch.__version__)"
5. 运行十六周项目；每次输出保存在独立目录：
   python -X utf8 labs\bootcamp.py --week 1
   将1改成1至16。第10周是小词表教学模型，不是预训练LLM；第11周是线性LoRA演示。
6. 原八周专项实验：
   python -X utf8 labs\lab.py --week 2
   第8周需要先运行第6周。不要把十六周周次直接套到原八周实验。
7. 完整二维扩散教学项目：
   python -X utf8 "labs\二维扩散_注释版.py" --help
   先读参数和源码，再决定是否训练。这不等于真实图像恢复基线复现。
8. 短练习示例：
   python -X utf8 labs\examples\b3.py
   工程桥梁示例：python -X utf8 labs\bridges\c34.py

先预测输出，再运行；把实际结果和失败原因写入网页的项目证据。网页不会自动收集本机结果。
结果、权重和图片请自行备份；网页JSON备份只包含笔记、回答、测验与自评。
包内不含预训练权重、原作者个人环境、学习记录或第三方论文附件。第三方库遵循各自许可。
真实模型下载与微调必须另行核对模型卡、数据许可、版本和资源；本包不提供商业或论文效果保证。
