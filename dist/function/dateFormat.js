"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateFormart = void 0;
const dateFormart = (date) => {
    let today = date === undefined ? new Date() : new Date(date);
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let dt = today.getDate();
    let newDay = dt < 10 ? '0' + String(dt) : String(dt);
    let newMonth = month < 10 ? '0' + String(month) : String(month);
    return year + '-' + newMonth + '-' + newDay;
};
exports.dateFormart = dateFormart;
