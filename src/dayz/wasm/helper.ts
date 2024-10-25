

export class LineAllocator {
    private mem: WebAssembly.Memory;
    private pointer: number = 0;
    constructor(mem:WebAssembly.Memory,pointer?:number) {
        this.mem = mem;
        if (pointer){
            this.pointer = pointer
        }
    }
    initMemory
    alloc(size:number){
        let pos = this.pointer
        this.pointer+=size;
        return pos
    }
    newPtrArray(size:number){
        let pos = this.pointer
        this.pointer+=size * 4;
        return pos
    }

    getPointerArray(pointer:number, count?:number){
        if (!count) count = 32
        return new Uint32Array(this.mem.buffer,pointer,count)
    }

}