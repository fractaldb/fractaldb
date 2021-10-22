export default function AssertUnreachable(x: never): never {
    throw new Error("Didn't expect to get here")
}