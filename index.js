import {
    checkComponentHasChildren,
    checkComponentNamedParams,
    checkNamedParams,
    checkComponentParam,
    ValidationError,
    TypeCheckError,
    ComponentTypeCheckError,
} from './src/validation.js';

import { dedent } from './src/strings.js';

import {
    ComponentException,
    RuntimeException,
    ValidationException,
    restoreExceptionPrototype,
} from './src/exceptions.js';

export {
    checkComponentHasChildren,
    checkComponentNamedParams,
    checkNamedParams,
    checkComponentParam,
    dedent,
    ValidationError,
    TypeCheckError,
    ComponentTypeCheckError,
    ValidationException,
    ComponentException,
    RuntimeException,
    restoreExceptionPrototype,
};
