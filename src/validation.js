/**
 * @typedef {('number' | 'string' | 'boolean')} ParamType
 */

/**
 * @typedef {{ type: ParamType, optional: boolean }} OptionalParamType
 */

/**
 * @typedef {Object<string, (ParamType | OptionalParamType)>} NamedParamTypes
 */

/**
 * @typedef {{ success: boolean, expected: ParamType, actual: ParamType }} TypeCheckResult
 */

/**
 * @typedef {{ paramName: string, result: TypeCheckResult }} ParamTypeCheckResult
 */

/**
 * @typedef {('type-check')} ErrorType
 */

export class Error {
    /**
     * @param {ErrorType} type
     */
    constructor(type) {
        this.type = type;
    }
}

export class TypeCheckError extends Error {
    /**
     * @param {string} componentName
     * @param {string} message
     */
    constructor(componentName, message) {
        super('type-check');
        this.componentName = componentName;
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
export const checkHasChildren = (componentName, componentOptions) => {
    if (!componentOptions.fn) {
        throw new ValidationException([
            new TypeCheckError(
                componentName,
                'This component needs an opening and a closing tag.'
            )
        ]);
    }
};

/**
 * Checks named parameters types.
 * @param {string} componentName
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @throws {ValidationException}
 */
export const checkNamedParams = (componentName, namedParamsTypes, namedParams) => {
    const errors = [];

    const mandatoryParamsNames = getMandatoryParamNames(namedParamsTypes);
    const mandatoryParamsChecks = checkParams(mandatoryParamsNames, namedParamsTypes, namedParams);
    const missingMandatoryParams = getMissingParams(mandatoryParamsChecks);
    const wronglyTypedMandatoryParams = getWronglyTypedParams(mandatoryParamsChecks);
    const missingMandatoryParamsNames = Object.keys(missingMandatoryParams);

    if (missingMandatoryParamsNames.length > 0) {
        missingMandatoryParamsNames.forEach(paramName => {
            const param = missingMandatoryParams[paramName];
            const paramType = typeof param === 'string' ? param : param.type;
            errors.push(new TypeCheckError(
                componentName,
                `Missing mandatory parameter "${paramName}" of type "${paramType}".`
            ));
        });
    }

    if (wronglyTypedMandatoryParams.length > 0) {
        wronglyTypedMandatoryParams.forEach(param => {
            errors.push(new TypeCheckError(
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

    const optionalParamsNames = getOptionalParamNames(namedParamsTypes);
    const optionalParamsChecks = checkParams(optionalParamsNames, namedParamsTypes, namedParams);
    const wronglyTypedOptionalParams = getWronglyTypedParams(optionalParamsChecks);

    if (wronglyTypedOptionalParams.length > 0) {
        wronglyTypedOptionalParams.forEach(param => {
            errors.push(new TypeCheckError(
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

    const illegalParamsNames = getIllegalParamNames(namedParamsTypes, namedParams);

    if (illegalParamsNames.length > 0) {
        illegalParamsNames.forEach(paramName => {
            errors.push(new TypeCheckError(
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
 * Returns a component's mandatory parameters names.
 * @param {NamedParamTypes} namedParamsTypes
 * @returns {string[]}
 */
const getMandatoryParamNames = (namedParamsTypes) =>
    Object.keys(namedParamsTypes).filter(paramName => {
        const type = namedParamsTypes[paramName];
        return typeof type === 'string' || !type.optional;
    });

/**
 * Returns a component's optional parameters names.
 * @param {NamedParamTypes} namedParamsTypes
 * @returns {string[]}
 */
const getOptionalParamNames = (namedParamsTypes) =>
    Object.keys(namedParamsTypes).filter(paramName => {
        const type = namedParamsTypes[paramName];
        return typeof type !== 'string' && type.optional;
    });

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
        if (namedParams.hasOwnProperty(paramName)) {
            return {
                paramName,
                result: checkType(namedParamsTypes[paramName], namedParams[paramName])
            };
        }
        return {
            paramName,
            result: {
                success: false,
                expected: namedParamsTypes[paramName],
                actual: null
            }
        };
    });

/**
 * Checks if a given value is of the right type.
 * @param {(ParamType | OptionalParamType)} expectedType
 * @param {any} givenValue
 * @returns {TypeCheckResult}
 */
const checkType = (expectedType, givenValue) => {
    expectedType = typeof expectedType === 'string' ? expectedType : expectedType.type;
    const givenType = typeof givenValue;

    return {
        success: givenType === expectedType,
        expected: expectedType,
        actual: givenType
    };
};

/**
 * Return the names of illegal parameters passed to a component.
 * @param {NamedParamTypes} namedParamsTypes
 * @param {Object} namedParams
 * @returns {string[]}
 */
const getIllegalParamNames = (namedParamsTypes, namedParams) =>
    Object.keys(namedParams).filter(paramName => !namedParamsTypes.hasOwnProperty(paramName));
