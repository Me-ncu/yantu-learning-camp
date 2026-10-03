"""Eight-week self-study labs. All numerical results are EDUCATIONAL, not paper results.
Weeks 2--8 use only Python standard library. Week 1 also checks installed PyTorch.
Gaussian image restoration below uses an analytical Gaussian prior, NOT a trained neural model.
"""
import argparse
import csv
import hashlib
import json
import math
import random
import statistics
import struct
import time
import zlib
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent


# 教学导读：输入输出路径和字典列表；按首行键名写CSV表头。utf-8-sig便于Excel识别中文；本课程调用时rows非空。
def csvwrite(path, rows):
    with path.open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


# 教学导读：仅用于显示灰度图。浮点像素裁到[0,1]再量化为8位；指标计算不使用这些裁剪值。PNG编码细节不是扩散必修。
def png(path, values, width=24):
    """Standard-library grayscale PNG encoder. Clipping is DISPLAY ONLY."""
    height = len(values)//width
    raw = b''.join(b'\0'+bytes(round(255*min(1,max(0,v))) for v in values[i*width:(i+1)*width]) for i in range(height))
    # 教学导读：封装PNG数据块：长度、类型、数据、CRC校验；网络字节序的大端编码是文件格式要求。
    def chunk(kind, data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',width,height,8,0,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))


# 教学导读：输入等长非空像素数组；逐像素差平方后平均。对齐和单位由调用者保证，不会自动配准。
def mse(a,b):
    if len(a)!=len(b) or not a:
        raise ValueError('输入必须非空且配对')
    return sum((x-y)**2 for x,y in zip(a,b))/len(a)


# 教学导读：调用MSE后转为PSNR；约定动态范围1。完全相同时返回正无穷，而不是0。
def psnr(a,b):
    error=mse(a,b)
    return float('inf') if error==0 else -10*math.log10(error)


# 教学导读：用固定种子改变相位，合成24×24灰度教学图。返回展平列表，不是下载的真实数据。
def image(seed, width=24):
    rng=random.Random(seed)
    phase=rng.uniform(-1,1)
    return [0.45+0.2*math.sin(x/4+phase)*math.cos(y/5)+0.1*(x>width//2) for y in range(width) for x in range(width)]


# 教学导读：顺序检查张量轴、手算梯度、200次线性拟合、推理及CSV保存。out是本次输出目录，day只是记录学习日。
def week1(out, day):
    import torch
    torch.set_num_threads(2)
    torch.manual_seed(7)
    x=torch.arange(24).reshape(2,3,2,2).float()
    assert tuple(x[0].permute(1,2,0).shape)==(2,2,3)
    w=torch.tensor(2.,requires_grad=True)
    b=torch.tensor(1.,requires_grad=True)
    loss=(w*3+b-10)**2
    loss.backward()
    assert w.grad.item()==-18 and b.grad.item()==-6
    net=torch.nn.Linear(1,1)
    opt=torch.optim.SGD(net.parameters(),lr=.1)
    xx=torch.linspace(-1,1,32)[:,None]
    trace=[]
    for k in range(200):
        ll=((net(xx)-(3*xx+2))**2).mean()
        opt.zero_grad(); ll.backward(); opt.step()
        trace.append({'step':k,'mse':ll.item()})
    assert trace[-1]['mse']<1e-5
    net.eval()
    with torch.inference_mode():
        pred=net(torch.tensor([[2.]]))
    csvwrite(out/'linear_loss.csv',trace)
    return {'shape':list(x.shape),'gradient_w':w.grad.item(),'gradient_b':b.grad.item(),'predict_x2':pred.item(),'torch':torch.__version__,'device':'cpu','day':day}


# 教学导读：以多个alpha_bar检查epsilon/x0/v转换恒等式；之后比较两种训练日程终端信号量。不是训练扩散模型。
def week2(out, day):
    rows=[]
    for ab in (.9,.5,.1):
        a,s=math.sqrt(ab),math.sqrt(1-ab)
        x0,eps=.8,-.3
        xt=a*x0+s*eps
        v=a*eps-s*x0
        recovered=a*xt-s*v
        assert abs(recovered-x0)<1e-12
        assert abs(s*xt+a*v-eps)<1e-12
        rows.append({'alpha_bar':ab,'xt':xt,'epsilon':eps,'v':v,'recovered_x0':recovered})
    # 教学导读：n为离散日程长度；每个alpha等于1-beta，累计乘积才是终端alpha_bar。
    def terminal(n):
        return math.prod(1-(1e-4+(.02-1e-4)*i/(n-1)) for i in range(n))
    csvwrite(out/'parameterization.csv',rows)
    return {'old_T100_alpha_bar':terminal(100),'T1000_alpha_bar':terminal(1000),'identity_max_error':'<1e-12','day':day}


# 教学导读：求解dx/dt=-x到t=1，比较Euler和Heun。每档重复6次，排除首轮再报中位耗时；同一步数不是同NFE。
def week3(out,day):
    rows=[]
    for method in ('euler','heun'):
        for n in (4,8,16,32):
            times=[]
            for repeat in range(6):
                start=time.perf_counter(); x=1.; h=1/n
                for _ in range(n):
                    d=-x
                    x+=h*d if method=='euler' else h*(d-(x+h*d))/2
                elapsed=time.perf_counter()-start
                if repeat: times.append(elapsed*1000)
            error=abs(x-math.exp(-1))
            rows.append({'method':method,'steps':n,'nfe':n if method=='euler' else 2*n,'error':error,'median_ms':statistics.median(times)})
    assert rows[-1]['error']<rows[3]['error']
    csvwrite(out/'solver.csv',rows)
    return {'equation':'dx/dt=-x, x(0)=1, exact x(1)=exp(-1)','scope':'generic ODE demo, NOT EDM or DPM-Solver reproduction','day':day}


# 教学导读：按场景编号分开验证与测试，生成同一噪声的不同强度版本；保存显示图，但在未裁剪浮点值上算指标。
def week4(out,day):
    rows=[]
    for split,base in [('validation',100),('test',200)]:
        for i in range(4):
            clean=image(base+i)
            rng=random.Random(base+i)
            noise=[rng.gauss(0,1) for _ in clean]
            for sigma in (.05,.15,.3):
                y=[v+sigma*z for v,z in zip(clean,noise)]
                name=f'{split}_{i}_{sigma}'
                png(out/(name+'_clean.png'),clean); png(out/(name+'_noisy.png'),y)
                rows.append({'split':split,'scene_id':base+i,'sigma':sigma,'mse':mse(clean,y),'psnr':psnr(clean,y),'data_range':1,'clipped_for_metric':False})
    assert abs(psnr([0],[.1])-20)<1e-10
    csvwrite(out/'manifest_metrics.csv',rows)
    return {'images':len(rows),'protocol':'grayscale float; no crop; data_range=1; raw metric; display clipped','day':day}


# 教学导读：输入观测列表y及噪声标准差sigma；固定先验均值0.5、标准差0.25。返回每像素后验均值列表和共同后验方差。
def posterior(y,sigma):
    # Prior X~N(mu=.5,tau^2=.25^2); Y=X+N(0,sigma^2).
    tau2=.25**2
    var=tau2*sigma*sigma/(tau2+sigma*sigma)
    mu=[(.5*sigma*sigma+v*tau2)/(tau2+sigma*sigma) for v in y]
    return mu,var


# 教学导读：给定观测y、噪声sigma、固定随机向量z和预算n，从噪声尺度1积分到0。返回数值近似与解析终点；n是解析向量场调用数，神经网络NFE为0。
def integrate(y,sigma,z,n):
    """VE probability-flow ODE dx/ds=s*(x-m)/(v+s*s), integrate s:1->0.
    Start from EXACT noisy posterior at s=1, not an approximate standard normal.
    n is analytical vector-field calls; neural NFE=0.
    """
    mu,var=posterior(y,sigma)
    x=[m+math.sqrt(var+1)*zz for m,zz in zip(mu,z)]
    h=-1/n
    for k in range(n):
        s=1+k*h
        c=s/(var+s*s)
        x=[v+h*c*(v-m) for v,m in zip(x,mu)]
    exact=[m+math.sqrt(var)*zz for m,zz in zip(mu,z)]
    return x,exact


# 教学导读：构造一幅合成干净图、带噪观测、采样随机向量和已知sigma。真实盲恢复中sigma并非免费可得，不能直接照搬。
def problem(seed):
    clean=image(seed)
    # sigma is observed sensor metadata in this lesson, NOT inferred degradation.
    sigma=(.05,.15,.3)[seed%3]
    r=random.Random(seed)
    y=[v+sigma*r.gauss(0,1) for v in clean]
    z=[r.gauss(0,1) for _ in clean]
    return clean,y,z,sigma


# 教学导读：输入已知sigma及冻结查找表，返回整数预算。不使用测试GT，不会在线重新调阈值。
def choose_budget(sigma,table):
    return table[str(sigma)]


# 教学导读：本函数做验证集预算表选择，不是温度缩放或概率校准！只用100—111场景和解析积分参考误差，阈值为0.0005。
def calibrate():
    # Only validation IDs and analytical ODE reference, never test GT.
    table={}
    for sigma in (.05,.15,.3):
        valid=[problem(i) for i in range(100,112) if problem(i)[3]==sigma]
        selected=64
        for n in (8,16,32,64):
            errors=[mse(*integrate(y,sig,z,n)) for _,y,z,sig in valid]
            if statistics.mean(errors)<=.0005:
                selected=n; break
        table[str(sigma)]=selected
    return table


# 教学导读：同一场景与初始噪声比较8/16/32/64步；同时记录数值解误差和清晰参考PSNR，二者不要混淆。
def week5(out,day):
    rows=[]
    clean,y,z,sigma=problem(200)
    for n in (8,16,32,64):
        x,exact=integrate(y,sigma,z,n)
        rows.append({'steps':n,'field_evals':n,'neural_nfe':0,'ode_reference_mse':mse(x,exact),'psnr_vs_gt':psnr(x,clean)})
        png(out/f'posterior_steps_{n}.png',x)
    png(out/'input.png',y);png(out/'gt.png',clean);png(out/'exact_posterior_sample.png',exact)
    csvwrite(out/'baseline.csv',rows)
    assert rows[-1]['ode_reference_mse']<rows[0]['ode_reference_mse']
    return {'prior':'independent Gaussian; deliberately mismatched to synthetic image','status':'analytical educational restoration baseline, NOT trained diffusion or paper reproduction','day':day}


# 教学导读：先用验证场景冻结查找表，再测200—211场景的固定/元数据/随机预算；计时包含选择与CPU积分，不含I/O和指标。随机预算不是比例匹配对照，真实论文需另补。
def week6(out,day):
    table=calibrate()
    (out/'frozen_validation_policy.json').write_text(json.dumps({'validation_ids':list(range(100,112)),'ode_mse_tolerance':.0005,'policy':table},indent=2),encoding='utf8')
    rows=[]
    for seed in range(200,212):
        clean,y,z,sigma=problem(seed)
        for method in ('fixed8','fixed16','fixed32','fixed64','metadata_policy','random_budget'):
            times=[]
            for repeat in range(6):
                start=time.perf_counter()
                n=choose_budget(sigma,table) if method=='metadata_policy' else random.Random(seed+99).choice((8,16,32,64)) if method=='random_budget' else int(method[5:])
                x,exact=integrate(y,sigma,z,n)
                latency=(time.perf_counter()-start)*1000
                if repeat: times.append(latency)
            rows.append({'scene_id':seed,'split':'test','method':method,'sigma_metadata':sigma,'field_evals':n,'neural_nfe':0,'median_ms':statistics.median(times),'raw_ms':json.dumps(times),'ode_mse':mse(x,exact),'psnr':psnr(x,clean),'status':'ok','peak_gpu_mb':'not_applicable_CPU'})
    csvwrite(out/'per_image.csv',rows)
    groups=[]
    for method in sorted(set(r['method'] for r in rows)):
        g=[r for r in rows if r['method']==method]
        groups.append({'method':method,'mean_psnr':statistics.mean(r['psnr'] for r in g),'mean_field_evals':statistics.mean(r['field_evals'] for r in g),'median_ms':statistics.median(r['median_ms'] for r in g),'scene_count':len(g)})
    csvwrite(out/'summary.csv',groups)
    # Readable offline SVG, no plotting dependency.
    circles=''.join(f'<circle cx="{40+r["mean_field_evals"]*6}" cy="{300-r["mean_psnr"]*8}" r="4"/><text x="{45+r["mean_field_evals"]*6}" y="{300-r["mean_psnr"]*8}">{r["method"]}</text>' for r in groups)
    (out/'quality_cost.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="350"><rect width="100%" height="100%" fill="white"/><text x="20" y="20">EDUCATIONAL: x=field calls; y=PSNR (higher)</text>'+circles+'</svg>',encoding='utf8')
    return {'policy':table,'scope':'synthetic Gaussian analytical lesson; controller uses sensor sigma metadata; timing includes policy and CPU solver, excludes metrics and I/O','day':day}


# 教学导读：比较直接输出输入、后验均值及后验样本；输入对自身残差为0但仍有噪声，这是反例而不是训练了可靠性检测器。
def week7(out,day):
    rows=[]
    for seed in range(200,212):
        clean,y,z,sigma=problem(seed)
        mu,var=posterior(y,sigma)
        # A=I: input itself has perfect residual but is noisy. A counterexample to residual-only ranking.
        for name,x in [('identity_input',y),('posterior_mean',mu),('posterior_sample',integrate(y,sigma,z,32)[0])]:
            rows.append({'scene_id':seed,'method':name,'residual_mse_vs_input':mse(x,y),'gt_mse':mse(x,clean),'psnr':psnr(x,clean)})
    csvwrite(out/'consistency_counterexample.csv',rows)
    assert all(r['residual_mse_vs_input']==0 for r in rows if r['method']=='identity_input')
    return {'finding':'input minimizes identity measurement residual exactly; residual alone cannot establish clean recovery','day':day}


# 教学导读：读取最近第六周逐图表，按同一场景配对求PSNR差，再有放回抽场景均值。缺上游结果就BLOCKED，不填造结果。
def week8(out,day):
    candidates=sorted((ROOT/'outputs').glob('week6_*/per_image.csv'))
    if not candidates:
        return {'status':'BLOCKED','reason':'先运行第六周，禁止制造结果'}
    source=candidates[-1]
    with source.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
    by={(r['scene_id'],r['method']):float(r['psnr']) for r in rows}
    diffs=[by[(str(i),'metadata_policy')]-by[(str(i),'fixed32')] for i in range(200,212)]
    rng=random.Random(8)
    boot=sorted(statistics.mean(rng.choices(diffs,k=len(diffs))) for _ in range(1000))
    return {'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scenes':len(diffs),'paired_mean_psnr_delta':statistics.mean(diffs),'exploratory_scene_bootstrap_95percent':[boot[25],boot[974]],'claim':'synthetic lesson only, not real-world evidence','decision':'基础练习可复盘；真实论文方向待真实基线与导师确认','day':day}


# 教学导读：读取--week和--day，创建不重名输出目录，调用对应实验并写run.json及脚本哈希；这些输出均标为EDUCATIONAL。
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--week',type=int,choices=range(1,9),required=True)
    p.add_argument('--day',type=int,choices=range(1,8),default=1)
    args=p.parse_args()
    out=ROOT/'outputs'/f'week{args.week}_{datetime.now():%Y%m%d_%H%M%S_%f}'
    out.mkdir(parents=True,exist_ok=False)
    result=globals()[f'week{args.week}'](out,args.day)
    result.update({'run_id':out.name,'evidence_class':'EDUCATIONAL','script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()})
    (out/'run.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps(result,ensure_ascii=False,indent=2)); print('OUTPUT:',out)


if __name__=='__main__': main()
