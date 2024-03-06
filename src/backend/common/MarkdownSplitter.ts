export class MarkdownSplitter {

    static splitMarkdownIntoChunks(markdown: string, splitter: RegExp): string[] {
        // Split the markdown by headings (lines starting with a single #)
        const chunks = markdown.split(splitter).filter(chunk => chunk.trim() !== '');

        // Remove leading and trailing whitespaces from each chunk
        return chunks.map(chunk => chunk.trim());
    }

    static splitAtTwoLevels(markdown: string): string[] {
        const regex = new RegExp(/\n(?=#\s+)/)
        const mainHeadings = this.splitMarkdownIntoChunks(markdown, regex)
        const subHeadings = mainHeadings.map((mainHeadingChunk) => {
            const regex = new RegExp(/\n(?=##\s+)/)
            return this.splitMarkdownIntoChunks(mainHeadingChunk, regex)
        }).flat()
        return subHeadings
    }

    /** Typically used before embeddings are created to remove any markdown-specific characters from the Markdown content  */
    static removeMarkdownCharacters(markdown: string): string {
        return markdown.replace('*', ' ')
            .replace('**', ' ')
            .replace(/#/g, ' ')
            .replace(/#/g, ' ')
            .replace(/##/g, ' ')
            .replace(/###/g, ' ')
            .replace(/####/g, ' ')
            .replace(/#####/g, ' ')
            .replace(/######/g, ' ')
            .replace(/\n/g, '')
            .replace(/```/g, ' ')
    }

}