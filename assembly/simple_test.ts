export function sumToN(n: i32): i32 {
    let sum: i32 = 0;
    for (let i: i32 = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}