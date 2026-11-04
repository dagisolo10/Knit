/**
 * Exception thrown when multiple controller handlers use the same HTTP method.
 */
export class DuplicateRouteMethodException extends Error {
    /**
     * @param method - The duplicated HTTP method.
     * @param controller - Name of the controller containing the duplicate routes.
     * @param existingHandler - Name of the previously registered handler.
     * @param duplicateHandler - Name of the handler causing the conflict.
     */
    constructor(method: string, controller: string, existingHandler: string, duplicateHandler: string) {
        super(`Duplicate HTTP method "${method}" route in ${controller}: "${existingHandler}" and "${duplicateHandler}".`);

        this.name = "DuplicateRouteMethodException";
    }
}
