/** convert a unix timestamp(microseconds) to a formatted
 * timestamp, like 03:00 for 3 minutes, or 03:00:00 for 3 hours.
 * @param usec unix microseconds
 * @returns a pretty timestamp string */
export function unixToTimestamp(usec: number): string {
    const seconds = Math.floor(usec % 60),
        minutes = Math.floor(seconds / 60),
        hours = Math.floor(minutes / 60);

    return `${hours >= 1 ? `${hours.toString().padStart(2, '0')}:` : ""}${
        minutes >= 1 ? `${minutes.toString().padStart(2, '0')}` : "00"}:${
        seconds >= 1 ? `${seconds.toString().padStart(2, '0')}` : "00"}`;
}

/** convert milliseconds to a formatted timestamp, 
 * like 03:00 for 3 minutes, or 03:00:00 for 3 hours.
 * @param millis number of milliseconds
 * @returns a pretty timestamp string */
export function millisToTimestamp(millis: number): string {
    const seconds = Math.floor(millis % 60),
        minutes = Math.floor(seconds / 60),
        hours = Math.floor(minutes / 60);

    return `${hours >= 1 ? `${hours.toString().padStart(2, '0')}:` : ""}${
        minutes >= 1 ? `${minutes.toString().padStart(2, '0')}` : "00"}:${
        seconds >= 1 ? `${seconds.toString().padStart(2, '0')}` : "00"}`;
}

/** convert seconds to a formatted timestamp, 
 * like 03:00 for 3 minutes, or 03:00:00 for 3 hours.
 * @param seconds number of milliseconds
 * @returns a pretty timestamp string */
export function secToTimestamp(seconds: number): string {
    const secs /* yoo */ = Math.floor(seconds % 60),
        minutes = Math.floor((seconds / 60) % 60),
        hours = Math.floor(minutes / 120);

    return `${hours >= 1 ? `${hours.toString().padStart(2, '0')}:` : ""}${
        minutes >= 1 ? `${minutes.toString().padStart(2, '0')}` : "00"}:${
        secs >= 1 ? `${secs.toString().padStart(2, '0')}` : "00"}`;
}
