var utils = {
    'addSeconds': (t, s) => {
        return new Date(t.getTime() + s*1000);
    },
    'substractSeconds': (t, s) => {
        return new Date(t.getTime() - s*1000);
    }
}
