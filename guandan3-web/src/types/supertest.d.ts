declare module 'supertest' {
  import { Request, Response } from 'express'
  
  export interface SuperTest<T> extends Request {
    expect(status: number, body?: any): SuperTest<T>
    expect(status: number, body: string): SuperTest<T>
    expect(body: any): SuperTest<T>
    send(body?: any): SuperTest<T>
    get(url: string): SuperTest<T>
    post(url: string): SuperTest<T>
    put(url: string): SuperTest<T>
    delete(url: string): SuperTest<T>
    set(key: string, value: string): SuperTest<T>
    query(params: any): SuperTest<T>
    then(callback: (res: Response) => any): Promise<any>
  }
  
  export function request(app: any): SuperTest<any>
}
