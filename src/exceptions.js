export class ComponentException {
    exceptionClass = 'ComponentException';

    /**
     * @param {string} componentName
     * @param {string} message
     */
    constructor(componentName, message) {
        this.componentName = componentName;
        this.message = message;
    }
}

export class RuntimeException {
    exceptionClass = 'RuntimeException';

    /**
     * @param {string} message
     * @param {string} info
     */
    constructor(message, info = null) {
        this.message = message;
        this.info = info;
    }
}

export class ValidationException {
    exceptionClass = 'ValidationException';

    /**
     * @param {ValidationError[]} errors
     */
    constructor(errors) {
        this.errors = errors;
    }
}

/**
 * Tries to restore an exception prototype.
 * @param {any} e
 * @returns {any}
 */
export const restoreExceptionPrototype = (e) => {
    switch (e.exceptionClass) {
        case 'RuntimeException':
            e.__proto__ = RuntimeException.prototype;
            break;

        case 'ComponentException':
            e.__proto__ = ComponentException.prototype;
            break;

        case 'ValidationException':
            e.__proto__ = ValidationException.prototype;
            break;

        default:
            e.__proto__ = Error.prototype; // Wild guess...
            break;
    }

    return e;
};
