export interface RagResponse<A> {
    input: string
    output: string
    references: A[]
}