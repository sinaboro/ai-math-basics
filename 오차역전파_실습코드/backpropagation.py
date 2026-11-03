# 오차역전파 - 실습 코드 (교안과 같은 순서)

# ===== 2장. 순전파 =====
x, y, z = -2, 5, -4        # 입력값

# 순전파 (Forward Pass)
q = x + y                  # 덧셈 노드
f = q * z                  # 곱셈 노드
print("q =", q)
print("f =", f)

# ===== 3장. 로컬 그래디언트 =====
# 로컬 그래디언트: 각 노드에서 '자기 입력'에 대한 미분
dq_dx = 1                  # q = x + y  ->  ∂q/∂x = 1
dq_dy = 1                  #               ∂q/∂y = 1
df_dq = z                  # f = q * z  ->  ∂f/∂q = z
df_dz = q                  #               ∂f/∂z = q
print("∂q/∂x =", dq_dx, " ∂q/∂y =", dq_dy)
print("∂f/∂q =", df_dq, " ∂f/∂z =", df_dz)

# ===== 4장. 연쇄법칙으로 미분 =====
# 연쇄법칙: (뒤에서 내려온 미분) x (로컬 그래디언트)
df_dx = df_dq * dq_dx
df_dy = df_dq * dq_dy
print("∂f/∂x =", df_dx)
print("∂f/∂y =", df_dy)
print("∂f/∂z =", df_dz)

# ===== 4장. 수치 미분으로 검산 =====
def F(x, y, z):
    return (x + y) * z

h = 1e-6
for name, d in [("x", (h, 0, 0)), ("y", (0, h, 0)), ("z", (0, 0, h))]:
    plus  = F(x + d[0], y + d[1], z + d[2])
    minus = F(x - d[0], y - d[1], z - d[2])
    print(f"수치 미분 ∂f/∂{name} =", round((plus - minus) / (2 * h), 4))

print("x 를 1 늘리면 f:", F(x, y, z), "->", F(x + 1, y, z))

# ===== 7장. 덧셈 · 곱셈 노드 클래스로 역전파 =====
class Add:
    def forward(self, a, b):
        return a + b
    def backward(self, dout):
        return dout * 1, dout * 1          # 덧셈: 그대로 나눠 준다

class Mul:
    def forward(self, a, b):
        self.a, self.b = a, b              # 순전파 때 입력을 저장 (= 로컬 그래디언트)
        return a * b
    def backward(self, dout):
        return dout * self.b, dout * self.a   # 곱셈: 서로 자리를 바꿔 곱한다

add, mul = Add(), Mul()

# 순전파
q = add.forward(x, y)
f = mul.forward(q, z)

# 역전파: 맨 끝에서 시작 (∂f/∂f = 1)
dq, dz = mul.backward(1)
dx, dy = add.backward(dq)
print("f =", f)
print("∂f/∂x =", dx, " ∂f/∂y =", dy, " ∂f/∂z =", dz)

# ===== 8장. 뉴런 하나의 역전파 =====
class Square:
    def forward(self, a):
        self.a = a
        return a ** 2
    def backward(self, dout):
        return dout * 2 * self.a

# 뉴런 하나 + 제곱 오차:  L = (w*x + b - y)^2
w, b = 2.0, 1.0
x_in, y_true = 3.0, 10.0

mul, add1, add2, sq = Mul(), Add(), Add(), Square()
p     = mul.forward(w, x_in)          # p = w*x
y_hat = add1.forward(p, b)            # y_hat = p + b
e     = add2.forward(y_hat, -y_true)  # e = y_hat - y
L     = sq.forward(e)                 # L = e^2
print(f"순전파: p={p}, y_hat={y_hat}, e={e}, L={L}")

de = sq.backward(1)                   # ∂L/∂e = 2e
dy_hat, _ = add2.backward(de)
dp, db = add1.backward(dy_hat)
dw, dx = mul.backward(dp)
print(f"역전파: ∂L/∂e={de}, ∂L/∂y_hat={dy_hat}, ∂L/∂w={dw}, ∂L/∂b={db}")
print("공식 2(y_hat - y)*x =", 2 * (y_hat - y_true) * x_in, ", 2(y_hat - y) =", 2 * (y_hat - y_true))

# ===== 8장. 역전파 + 경사하강법으로 선형 회귀 학습 =====
import numpy as np
rng = np.random.default_rng(42)
X = rng.uniform(0, 5, 30)
Y = 3 * X + 2 + rng.normal(0, 0.5, 30)

class Mean:
    def forward(self, a):
        self.n = len(a)
        return a.mean()
    def backward(self, dout):
        return dout * np.ones(self.n) / self.n

w, b, lr = 0.0, 0.0, 0.05
mul, add1, add2, sq, mean = Mul(), Add(), Add(), Square(), Mean()
for epoch in range(1, 501):
    # 순전파
    L = mean.forward(sq.forward(add2.forward(add1.forward(mul.forward(w, X), b), -Y)))
    # 역전파
    de = sq.backward(mean.backward(1))
    dy_hat, _ = add2.backward(de)
    dp, db_vec = add1.backward(dy_hat)
    dw_vec, _ = mul.backward(dp)
    dw, db = dw_vec.sum(), db_vec.sum()   # w, b 는 30개 데이터에 공통 -> 합친다
    w, b = w - lr * dw, b - lr * db
    if epoch in (1, 10, 100, 500):
        print(f"epoch {epoch:3d} | MSE = {L:8.4f} | w = {w:.4f}, b = {b:.4f}")
print("최소제곱법 :", np.round(np.polyfit(X, Y, 1), 4))
