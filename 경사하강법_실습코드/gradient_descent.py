# 경사하강법 기본 수식 - 실습 코드 (교안과 같은 순서)

# ===== 0. 준비 (실습 데이터) =====
import numpy as np
import sympy as sp
np.set_printoptions(precision=4, suppress=True)

# 실습 데이터: 정답 규칙 y = 3x + 2 에 약간의 잡음을 섞은 30개
rng = np.random.default_rng(42)
X = rng.uniform(0, 5, 30)
Y = 3 * X + 2 + rng.normal(0, 0.5, 30)
print("X 앞 5개:", X[:5])
print("Y 앞 5개:", Y[:5])

# ===== 1장. 오차의 합 vs SSE · MSE · MAE =====
y     = np.array([3.0, 5.0, 7.0, 9.0])     # 실제값
y_hat = np.array([4.0, 4.0, 8.0, 8.0])     # 예측값

err = y_hat - y                            # 영상의 오차 정의: y hat - y
print("오차 y_hat - y :", err)
print("그냥 더하면    :", err.sum(), "  <- +, - 가 상쇄되어 0!")
print("SSE (제곱 합)  :", np.sum(err ** 2))
print("MSE (제곱 평균):", np.mean(err ** 2))
print("MAE (절댓값 평균):", np.mean(np.abs(err)))

# ===== 2장. w 를 바꿔 가며 손실 재 보기 =====
def mse(w, b):
    Y_hat = w * X + b
    return np.mean((Y_hat - Y) ** 2)

# b = 2 로 고정하고 w 만 바꿔 가며 손실을 재 보기
for w in [0, 1, 2, 2.5, 3, 3.5, 4, 5]:
    print(f"w = {w:3.1f}  ->  MSE = {mse(w, 2):8.4f}")

# ===== 4장. sympy 로 편미분 확인 =====
w, b, x, y = sp.symbols('w b x y')
loss = (w*x + b - y)**2                   # 데이터 1개의 제곱 오차

print("∂/∂w :", sp.factor(sp.diff(loss, w)))
print("∂/∂b :", sp.factor(sp.diff(loss, b)))

# ===== 4장. 공식 기울기 vs 수치 기울기 =====
def grad(w, b):
    Y_hat = w * X + b
    dw = 2 * np.mean((Y_hat - Y) * X)     # ∂MSE/∂w
    db = 2 * np.mean(Y_hat - Y)           # ∂MSE/∂b
    return dw, db

w, b, h = 1.0, 0.0, 1e-6
num_dw = (mse(w + h, b) - mse(w - h, b)) / (2 * h)    # 숫자로 잰 기울기
num_db = (mse(w, b + h) - mse(w, b - h)) / (2 * h)
print("공식 dw, db :", np.round(grad(w, b), 4))
print("수치 dw, db :", np.round([num_dw, num_db], 4))

# ===== 7장. 경사하강법으로 y = 3x + 2 찾기 =====
w, b = 0.0, 0.0          # 아무 값에서 출발
lr = 0.05                # 학습률 (learning rate)

for epoch in range(1, 501):
    Y_hat = w * X + b                       # 1) 예측
    error = Y_hat - Y                       # 2) 오차 (y hat - y)
    gd_w = lr * np.mean(error * X)          # 3) LR * MEAN((y hat - y) * x)
    gd_b = lr * np.mean(error)              #    LR * MEAN(y hat - y)
    w = w - gd_w                            # 4) 업데이트
    b = b - gd_b
    if epoch in (1, 10, 50, 100, 500):
        print(f"epoch {epoch:3d} | MSE = {np.mean(error**2):8.4f} | w = {w:.4f}, b = {b:.4f}")

# ===== 8장. 학습률 실험 =====
def train(lr, epochs=200):
    w, b = 0.0, 0.0
    for _ in range(epochs):
        error = (w * X + b) - Y
        w -= lr * np.mean(error * X)
        b -= lr * np.mean(error)
    return w, b, mse(w, b)

for lr in [0.001, 0.01, 0.05, 0.1, 0.25]:
    w, b, loss = train(lr)
    print(f"lr = {lr:<6} | w = {w:10.4g}, b = {b:10.4g} | MSE = {loss:.4g}")

# ===== 8장. 경사하강법 vs 최소제곱법 =====
w_gd, b_gd, _ = train(0.05, epochs=2000)
w_ls, b_ls = np.polyfit(X, Y, 1)             # 최소제곱법(OLS)으로 한 번에 계산

print(f"경사하강법 : w = {w_gd:.4f}, b = {b_gd:.4f}")
print(f"최소제곱법 : w = {w_ls:.4f}, b = {b_ls:.4f}")
