
export const dateFormart = (date?: string) => {
    let today = date === undefined ? new Date() : new Date(date);
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let dt = today.getDate();
    let newDay: string = dt < 10 ? '0' + String(dt) : String(dt)
    let newMonth: string = month < 10 ? '0' + String(month) : String(month);
    return year + '-' + newMonth + '-' + newDay;
}
