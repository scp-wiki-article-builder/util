export class ComponentException {
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
    /**
     * @param {string} message
     */
    constructor(message) {
        this.message = message;
    }
}
