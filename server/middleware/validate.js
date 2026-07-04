function formatZodIssues(error) {
    return error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));
}

function validate(schemas = {}) {
    return (req, res, next) => {
        const targets = ['params', 'query', 'body'];

        for (const target of targets) {
            const schema = schemas[target];

            if (!schema) {
                continue;
            }

            const result = schema.safeParse(req[target]);

            if (!result.success) {
                const error = new Error(`Invalid request ${target}`);
                error.statusCode = 400;
                error.details = formatZodIssues(result.error);
                return next(error);
            }

            req[target] = result.data;
        }

        return next();
    };
}

module.exports = validate;
