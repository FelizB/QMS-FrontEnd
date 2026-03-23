// orval.config.ts

const config = {
  qms: {
    //input: './openapi.json',
    input :"http://localhost:8000/openapi.json",

    output: {
      mode: 'single',
      target: './src/generated/sdk/endpoints.ts',
      schemas: './src/generated/sdk/models',
      client: 'axios',
      prettier: true,
      clean: false,

      override: {
        reactQuery: {
          version: 5,
          queryOptions: { retry: 1, staleTime: 0 },
          mutationOptions: { retry: false },
        },
        
        mutator: {
          path: './src/sdk/customInstance.ts',
          name: 'customInstance',
        },

        operationName: (operation: any, route: string, method: string) => {
          const toCamel = (value?: string) => {
            if (!value) return 'op';

            const clean = value
              .normalize('NFKD')
              .replace(/[^a-zA-Z0-9\s-]/g, ' ')
              .trim()
              .replace(/\s+/g, ' ');

            const parts = clean.split(' ');
            const head = (parts[0] || 'op').toLowerCase();

            const tail = parts
              .slice(1)
              .map(
                (w: string) =>
                  w.charAt(0).toUpperCase() +
                  w.slice(1).toLowerCase()
              );

            return head + tail.join('');
          };

          const versionMatch = route.match(/^\/api\/(v\d+)/i);
          const version = (versionMatch?.[1] || 'v1').toLowerCase();

          const tag = (operation.tags?.[0] || 'root')
            .toLowerCase()
            .replace(/\s+/g, '');

          const verb = method.toLowerCase();

          const summaryCamel = toCamel(
            operation.summary || operation.operationId
          );

          return `${tag}_${version}_${verb}_${summaryCamel}`;
        },

        operationNameFormatter: (name: string) => name,
      },
    },
  },
};

export default config;