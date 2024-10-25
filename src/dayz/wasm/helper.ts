

export class LineAllocator {
    private mem: WebAssembly.Memory;
    private pointer: number = 0;
    constructor(mem:WebAssembly.Memory,pointer?:number) {
        this.mem = mem;
        if (pointer){
            this.pointer = pointer
        }
    }
    alloc(size:number){
        let pos = this.pointer
        this.pointer+=size;
        return pos
    }

}