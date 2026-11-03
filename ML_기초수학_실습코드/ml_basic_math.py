# 머신러닝 입문자를 위한 기초 수학 - 실습 코드 (교안과 같은 순서)

# ===== 0. 준비 =====
import numpy as np
import sympy as sp
np.set_printoptions(precision=4, suppress=True)
print("numpy", np.__version__, "/ sympy", sp.__version__)

# ===== 1장. 실제값 · 예측값 · 평균값 =====
y     = np.array([3.0, 5.0, 7.0, 9.0])   # 실제값 y (정답 데이터)
y_hat = np.array([2.5, 5.5, 6.5, 9.5])   # 모델이 예측한 값 y hat
y_bar = y.mean()                         # 실제값의 평균 y bar

print("실제값 y      :", y)
print("예측값 y_hat  :", y_hat)
print("평균값 y_bar  :", y_bar)
print("오차 y - y_hat:", y - y_hat)

# ===== 3장. Σ 는 반복문 =====
x = [2, 4, 6, 8, 10]          # x1 ~ x5  (n = 5)

total = 0
for i in range(len(x)):       # 수학의 i = 1..n  ->  파이썬은 0..n-1
    total += x[i]

print("반복문으로 더한 값:", total)
print("sum() 결과        :", sum(x))
print("np.sum() 결과     :", np.sum(x))

# ===== 4장. 평균과 Σ 의 성질 =====
n = len(x)
x_bar = sum(x) / n                          # (1/n) * Σx
print("평균 x_bar =", x_bar, " / np.mean =", np.mean(x))

# 규칙 1)  Σx = n * x_bar
print("Σx =", sum(x), "   n * x_bar =", n * x_bar)

# 규칙 2)  상수 b 를 n 번 더하면  n * b
b = 7
print("Σb =", sum(b for _ in range(n)), "   n * b =", n * b)

# 규칙 3)  상수 c 는 Σ 밖으로 꺼낼 수 있다
c = 3
print("Σ(c*x) =", sum(c * xi for xi in x), "   c * Σx =", c * sum(x))

# ===== 5장. 1차 함수 wx + b =====
def f(x, w, b):
    return w * x + b                      # y = wx + b

xs = np.array([0, 1, 2, 3])
print("w=2, b=1 :", f(xs, 2, 1))
print("w=3, b=1 :", f(xs, 3, 1), " <- w 증가: 기울기가 가팔라짐")
print("w=2, b=5 :", f(xs, 2, 5), " <- b 증가: 위로 평행이동")

# ===== 7장. 수치 미분 =====
def diff(func, x, h=1e-5):
    """중앙 차분으로 x 지점의 기울기(미분값)를 근사"""
    return (func(x + h) - func(x - h)) / (2 * h)

print("y = 3     , x=2 에서 기울기:", round(diff(lambda x: 3, 2), 4))
print("y = 2x + 3, x=2 에서 기울기:", round(diff(lambda x: 2*x + 3, 2), 4))
print("y = x^2   , x=2 에서 기울기:", round(diff(lambda x: x**2, 2), 4), " (2x = 4)")
print("y = x^2   , x=-1 에서 기울기:", round(diff(lambda x: x**2, -1), 4), " (2x = -2)")

# ===== 7장. sympy 로 미분 규칙 확인 =====
x = sp.symbols('x')

for expr in [sp.Integer(3), 2*x + 3, x**2, x**3, 5*x**4]:
    print(f"y = {str(expr):8s} ->  y' = {sp.diff(expr, x)}")

# ===== 8장. 편미분 =====
a, b = sp.symbols('a b')
y = 2*a**2 + 3*b + 6

print("y     =", y)
print("∂y/∂a =", sp.diff(y, a))      # b, 6 은 상수 취급 -> 사라짐
print("∂y/∂b =", sp.diff(y, b))      # 2a^2, 6 은 상수 취급 -> 사라짐

# 숫자로 확인: (a, b) = (1, 2) 에서 a 만 아주 조금 움직여 보기
fy = sp.lambdify((a, b), y)
h = 1e-5
print("수치 ∂y/∂a (a=1) :", round((fy(1 + h, 2) - fy(1 - h, 2)) / (2*h), 4))
print("수치 ∂y/∂b (b=2) :", round((fy(1, 2 + h) - fy(1, 2 - h)) / (2*h), 4))

# ===== 9장. 연쇄법칙 =====
a, b, x = sp.symbols('a b x')
f = a*x**2 + b          # 안쪽 함수 f(x)
g = f**3                # 바깥 함수 g(u) = u^3 에 f 를 넣은 g(f(x))

direct = sp.diff(g, x)                 # sympy 가 바로 미분
chain  = 3*f**2 * sp.diff(f, x)        # 연쇄법칙: 바깥 미분 x 안쪽 미분

print("g(f(x))       =", g)
print("sympy 미분    =", direct)
print("연쇄법칙 결과 =", chain)
print("두 결과 같은가?", sp.simplify(direct - chain) == 0)

# ===== 10장. 제곱오차의 편미분 =====
w, b, xi, yi = sp.symbols('w b x_i y_i')
loss_i = (yi - (w*xi + b))**2           # 데이터 한 개의 제곱 오차

print("∂/∂w :", sp.factor(sp.diff(loss_i, w)))
print("∂/∂b :", sp.factor(sp.diff(loss_i, b)))

# ===== 10장. 경사하강법으로 y = 2x + 1 찾기 =====
X = np.array([1, 2, 3, 4, 5], dtype=float)
Y = np.array([3, 5, 7, 9, 11], dtype=float)    # 정답 규칙: y = 2x + 1

w, b = 0.0, 0.0       # 아무 값에서나 출발
lr = 0.05             # 학습률: 한 번에 얼마나 움직일지

for step in range(1, 1001):
    Y_hat = w * X + b                  # 1) 예측 y hat
    err = Y - Y_hat                    # 2) 오차 y - y hat
    mse = np.mean(err ** 2)            # 3) 손실 MSE
    dw = -2 * np.mean(err * X)         # 4) ∂MSE/∂w
    db = -2 * np.mean(err)             #    ∂MSE/∂b
    w -= lr * dw                       # 5) 기울기 반대 방향으로 이동
    b -= lr * db
    if step in (1, 10, 100, 1000):
        print(f"step {step:4d} | MSE = {mse:8.4f} | w = {w:.4f}, b = {b:.4f}")
