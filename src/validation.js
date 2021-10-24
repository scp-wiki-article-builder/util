/**
 * @typedef {('number' | 'string' | 'boolean' | 'object' | 'components')} ParamType
 */

/**
 * @typedef {{ type: ParamType, optional: boolean }} OptionalParamType
 */

/**
 * @typedef {function(): NamedParamTypes} NestedParamTypes
 */

/**
 * @typedef {(ParamType | OptionalParamType | NestedParamTypes)} NamedParamType
 */

/**
 * @typedef {Object<string, NamedParamType>} NamedParamTypes
 */

/**
 * @typedef {{ success: boolean, expected: ParamType, actual: ParamType }} TypeCheckResult
 */

/**
 * @typedef {{ paramName: string, result: TypeCheckResult }} ParamTypeCheckResult
 */

/**
 * @typedef {('type-check' | 'component-type-check')} ErrorType
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string[]} missingMandatoryParamsNames
 * @property {ParamTypeCheckResult[]} wronglyTypedMandatoryParams
 * @property {ParamTypeCheckResult[]} wronglyTypedOptionalParams
 * @property {string[]} illegalParamsNames
 */

export class Error {
    /**
     * @param {ErrorType} type
     */
    constructor(type) {
        this.type = type;
    }
}

export class ComponentTypeCheckError extends Error {
    /**
     * @param {string} componentName
     * @param {string} message
     */
    constructor(componentName, message) {
        super('component-type-check');
        this.componentName = componentName;
        this.message = message;
    }
}

export class TypeCheckError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super('type-check');
        this.message = message;
    }
}

export class ValidationException {
    /**
     * @param {Error[]} errors
     */
    constructor(errors) {
        this.errors = errors;
    }
}

/**
 * @param {string} paramName
 * @param {ParamType} expectedType
 * @param {ParamType} actualType
 * @param {boolean} isOptional
 * @returns {string}
 */
const wrongTypeMessage = (paramName, expectedType, actualType, isOptional) =>
    `Wrong type for ${isOptional ? 'optional' : 'mandatory'} parameter "${paramName}", ` +
    `given value type is "${actualType}" but "${expectedType}" was expected.`;

/**
 * Asserts that a component has children.
 * @param {string} componentName
 * @param {Handlebars.HelperOptions} componentOptions
 */
export const checkComponentHasChildren = (componentName, componentOptions) => {
    if (!componentOptions.fn) {
        throw new ValidationException([
            new ComponentTypeCheckError(
                componentName,
                'This component needs an opening and a closing tag.'
            )
        ]);
    }
};

/**
 * Checks a component named parameters types.
 * @param {string} componentName
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @throws {ValidationException}
 */
export const checkComponentNamedParams = (componentName, namedParamsTypes, namedParams) => {
    const errors = [];

    const {
        missingMandatoryParamsNames,
        wronglyTypedMandatoryParams,
        wronglyTypedOptionalParams,
        illegalParamsNames
    } = _checkNamedParams(namedParamsTypes, namedParams);

    if (missingMandatoryParamsNames.length > 0) {
        missingMandatoryParamsNames.forEach(paramName => {
            const param = missingMandatoryParams[paramName];
            const paramType = typeof param === 'string' ? param : param.type;
            errors.push(new ComponentTypeCheckError(
                componentName,
                `Missing mandatory parameter "${paramName}" of type "${paramType}".`
            ));
        });
    }

    if (wronglyTypedMandatoryParams.length > 0) {
        wronglyTypedMandatoryParams.forEach(param => {
            errors.push(new ComponentTypeCheckError(
                componentName,
                wrongTypeMessage(
                    param.paramName,
                    param.result.expected,
                    param.result.actual,
                    false
                )
            ));
        });
    }

    if (wronglyTypedOptionalParams.length > 0) {
        wronglyTypedOptionalParams.forEach(param => {
            errors.push(new ComponentTypeCheckError(
                componentName,
                wrongTypeMessage(
                    param.paramName,
                    param.result.expected,
                    param.result.actual,
                    true
                )
            ));
        });
    }

    if (illegalParamsNames.length > 0) {
        illegalParamsNames.forEach(paramName => {
            errors.push(new ComponentTypeCheckError(
                componentName,
                `Unexpected parameter "${paramName}".`
            ));
        });
    }

    if (errors.length > 0) {
        throw new ValidationException(errors);
    }
};

/**
 * Checks named parameters types.
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @throws {ValidationException}
 */
export const checkNamedParams = (namedParamsTypes, namedParams) => {
    const errors = [];

    const {
        missingMandatoryParamsNames,
        wronglyTypedMandatoryParams,
        wronglyTypedOptionalParams,
        illegalParamsNames
    } = _checkNamedParams(namedParamsTypes, namedParams);

    if (missingMandatoryParamsNames.length > 0) {
        missingMandatoryParamsNames.forEach(paramName => {
            const param = missingMandatoryParams[paramName];
            const paramType = typeof param === 'string' ? param : param.type;
            errors.push(new TypeCheckError(
                `Missing mandatory parameter "${paramName}" of type "${paramType}".`
            ));
        });
    }

    if (wronglyTypedMandatoryParams.length > 0) {
        wronglyTypedMandatoryParams.forEach(param => {
            errors.push(new TypeCheckError(
                wrongTypeMessage(
                    param.paramName,
                    param.result.expected,
                    param.result.actual,
                    false
                )
            ));
        });
    }

    if (wronglyTypedOptionalParams.length > 0) {
        wronglyTypedOptionalParams.forEach(param => {
            errors.push(new TypeCheckError(
                wrongTypeMessage(
                    param.paramName,
                    param.result.expected,
                    param.result.actual,
                    true
                )
            ));
        });
    }

    if (illegalParamsNames.length > 0) {
        illegalParamsNames.forEach(paramName => {
            errors.push(new TypeCheckError(
                `Unexpected parameter "${paramName}".`
            ));
        });
    }

    if (errors.length > 0) {
        throw new ValidationException(errors);
    }
};

/**
 * Checks named parameters types.
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @returns {ValidationResult}
 */
const _checkNamedParams = (namedParamsTypes, namedParams) => {
    const mandatoryParamsNames = getMandatoryParamNames(namedParamsTypes);
    const mandatoryParamsChecks = checkParams(mandatoryParamsNames, namedParamsTypes, namedParams);
    const missingMandatoryParams = getMissingParams(mandatoryParamsChecks);
    const wronglyTypedMandatoryParams = getWronglyTypedParams(mandatoryParamsChecks);
    const missingMandatoryParamsNames = Object.keys(missingMandatoryParams);

    const optionalParamsNames = getOptionalParamNames(namedParamsTypes);
    const optionalParamsChecks = checkParams(optionalParamsNames, namedParamsTypes, namedParams);
    const wronglyTypedOptionalParams = getWronglyTypedParams(optionalParamsChecks);

    const illegalParamsNames = getIllegalParamNames(namedParamsTypes, namedParams);

    return {
        missingMandatoryParamsNames,
        wronglyTypedMandatoryParams,
        wronglyTypedOptionalParams,
        illegalParamsNames
    };
};

/**
 * Returns a component's mandatory parameters names.
 * @param {NamedParamTypes} namedParamsTypes
 * @returns {string[]}
 */
const getMandatoryParamNames = (namedParamsTypes) =>
    getParamNames([], namedParamsTypes,
        (paramType) => typeof paramType === 'string' || !paramType.optional);

/**
 * Returns a component's optional parameters names.
 * @param {NamedParamTypes} namedParamsTypes
 * @returns {string[]}
 */
const getOptionalParamNames = (namedParamsTypes) =>
    getParamNames([], namedParamsTypes,
        (paramType) => typeof paramType === 'object' && paramType.optional);

/**
 * Returns all the parameters (as paths).
 * @param {string[]} path
 * @param {NamedParamTypes} pathNamedParamsTypes
 * @param {function((ParamType | OptionalParamType)): boolean} filterFn
 * @returns {string[]}
 */
const getParamNames = (path, pathNamedParamsTypes, filterFn) =>
    Object.keys(pathNamedParamsTypes).reduce((list, paramName) => {
        const paramType = pathNamedParamsTypes[paramName];
        const paramTypeType = typeof paramType;

        if (paramTypeType === 'string' || paramTypeType === 'object') {
            // { name: 'typeName' } or { name: { type: 'typeName', optional: isOptional } }
            if (!filterFn || filterFn(paramType)) {
                return [ ...list, [ ...path, paramName].join('.') ];
            } else {
                return list;
            }
        } else if (paramTypeType === 'function') {
            // { name: () => ({ name: 'typeName' }) }
            return [ ...list, ...getParamNames([ ...path, paramName ], paramType(), filterFn) ];
        }
    }, []);

/**
 * Returns missing parameters.
 * @param {ParamTypeCheckResult[]} paramTypeCheckResults
 * @returns {NamedParamTypes}
 */
const getMissingParams = (paramTypeCheckResults) =>
    paramTypeCheckResults.filter(({ result }) => !result.success && !result.actual)
        .reduce((acc, { paramName, result }) => {
            acc[paramName] = result.expected;
            return acc;
        }, {});

/**
 * Returns parameters for which the given values are of the wrong type.
 * @param {ParamTypeCheckResult[]} paramsTypeCheckResults
 * @returns {ParamTypeCheckResult[]}
 */
const getWronglyTypedParams = (paramsTypeCheckResults) =>
    paramsTypeCheckResults.filter(({ result }) => !result.success && !!result.actual);

/**
 * Checks the types of the given parameters values.
 * @param {string[]} paramsNames
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @returns {ParamTypeCheckResult[]}
 */
const checkParams = (paramsNames, namedParamsTypes, namedParams) =>
    paramsNames.map(paramName => {
        if (hasParam(namedParams, paramName)) {
            return {
                paramName,
                result: checkParamType(paramName, namedParamsTypes, namedParams)
            };
        }
        return {
            paramName,
            result: {
                success: false,
                expected: getParamExpectedType(paramName, namedParamsTypes),
                actual: null
            }
        };
    });

/**
 * Returns a parameter expected type.
 * @param {string} paramName
 * @param {NamedParamTypes} pathNamedParamsTypes
 * @returns {ParamType}
 */
const getParamExpectedType = (paramName, pathNamedParamsTypes) => {
    /**
     * @param {string[]} remainingPath
     * @param {NamedParamTypes} pathNamedParamsTypes
     * @returns {ParamType}
     */
    const getParamExpectedTypePath = (remainingPath, pathNamedParamsTypes) => {
        if (remainingPath.length === 1) {
            let expectedType = pathNamedParamsTypes[remainingPath[0]];
            expectedType = typeof expectedType === 'string'
                ? expectedType
                : typeof expectedType === 'object'
                    ? expectedType.type
                    : (() => { throw 'Illegal state' })();
            return expectedType;
        } else {
            let subpathParamTypes = pathNamedParamsTypes[remainingPath[0]];
            subpathParamTypes = typeof subpathParamTypes === 'function'
                ? subpathParamTypes()
                : subpathParamTypes;
            return getParamExpectedTypePath(remainingPath.splice(1), subpathParamTypes);
        }
    };

    return getParamExpectedTypePath(paramName.split('.'), pathNamedParamsTypes);
};

/**
 * Checks that an object have a path of properties.
 * @param {any} namedParams
 * @param {string} pathParamName
 * @returns {boolean}
 */
const hasParam = (namedParams, pathParamName) => {
    /**
     * @param {any} pathNamedParams
     * @param {string[]} remainingPath
     * @returns {boolean}
     */
    const hasParamPath = (pathNamedParams, remainingPath) => {
        const check = pathNamedParams.hasOwnProperty(remainingPath[0]);
        if (check) {
            if (remainingPath.length > 1) {
                return hasParamPath(pathNamedParams[remainingPath[0]], remainingPath.splice(1));
            } else {
                return true;
            }
        }
        return false;
    }

    return hasParamPath(namedParams, pathParamName.split('.'));
};

/**
 * Checks the type of a parameter name path.
 * @param {string} pathParamName
 * @param {NamedParamTypes} namedParamTypes
 * @param {any} namedParamValues
 * @returns {TypeCheckResult}
 */
const checkParamType = (pathParamName, namedParamTypes, namedParamValues) => {
    /**
     * @param {string[]} remainingPath
     * @param {NamedParamTypes} pathParamTypes
     * @param {any} pathParamValues
     * @returns {TypeCheckResult}
     */
    const checkParamTypePath = (remainingPath, pathParamTypes, pathParamValues) => {
        if (remainingPath.length === 1) {
            let expectedType = pathParamTypes[remainingPath[0]];
            const givenValue = pathParamValues[remainingPath[0]];
            const givenType = typeof givenValue;

            expectedType = typeof expectedType === 'string'
                ? expectedType
                : typeof expectedType === 'object'
                    ? expectedType.type
                    : (() => { throw 'Illegal state' })();

            const success = expectedType === 'components'
                ? typeof givenValue === 'object'
                    && Object.keys(givenValue)
                        .every(key => typeof givenValue[key] === 'function')
                : givenType === expectedType;
            return {
                success,
                expected: expectedType,
                actual: givenType
            };
        } else {
            let subpathParamTypes = pathParamTypes[remainingPath[0]];
            subpathParamTypes = typeof subpathParamTypes === 'function'
                ? subpathParamTypes()
                : subpathParamTypes;
            return checkParamTypePath(
                remainingPath.splice(1),
                subpathParamTypes,
                pathParamValues[remainingPath[0]]
            );
        }
    };

    return checkParamTypePath(pathParamName.split('.'), namedParamTypes, namedParamValues);
};

/**
 * Return the names of illegal parameters passed to a component.
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @returns {string[]}
 */
const getIllegalParamNames = (namedParamsTypes, namedParams) =>
    Object.keys(namedParams).filter(paramName => !namedParamsTypes.hasOwnProperty(paramName));
