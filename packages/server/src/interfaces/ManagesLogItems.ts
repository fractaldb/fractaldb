
export default abstract class ManagesLogItems {
    items: Map<number, string | null> = new Map()
    /**
     * Number of increment operations that have been applied in this log
     */
    increments: number = 0
    freed: Set<number> = new Set()
    used: Set<number> = new Set()
}