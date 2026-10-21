#include <cstdio>
int main() {
    __builtin_cpu_init();
    const bool simd = __builtin_cpu_supports("avx2") && __builtin_cpu_supports("fma") && __builtin_cpu_supports("f16c");
    std::puts(simd ? "avx2" : "generic");
    return 0;
}
