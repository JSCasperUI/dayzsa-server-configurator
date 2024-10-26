

export class WPointer {
    ptr:number
    private size:4
    private memoryBuffer: ArrayBuffer;
    constructor(buffer:ArrayBuffer,pointer:number) {
        this.memoryBuffer = buffer
        this.ptr = pointer
    }


}
export class WPointerArrayOfPointers extends WPointer {
    count:number
    array:Uint32Array
    constructor(buffer:ArrayBuffer,pointer:number,count:number) {
        super(buffer,pointer);
        this.count = count
        this.array = new Uint32Array(buffer,pointer,count)
    }

    getPtr(index:number){
        return this.array[index]
    }
    setPtr(index:number,value:number){
        this.array[index] = value
    }


}

export class WPointerArrayUInt32 extends WPointerArrayOfPointers {
    getValue(index:number){
        return this.array[index]
    }
    setValue(index:number,value:number){
        this.array[index] = value
    }
}


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
    newArray(size:number):WPointerArrayOfPointers{
        let pos = this.pointer
        this.pointer+=size * 4;
        return new WPointerArrayOfPointers(this.mem.buffer,pos,size)
    }
    newArrayUInt32(size:number):WPointerArrayUInt32{
        let pos = this.pointer
        this.pointer+=size * 4;
        return new WPointerArrayUInt32(this.mem.buffer,pos,size)
    }

    getPointerArray(pointer:number, count?:number){
        if (!count) count = 32
        return new Uint32Array(this.mem.buffer,pointer,count)
    }

}