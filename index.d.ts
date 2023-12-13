export const render: (md: string, urlTransform?: (url: string, element: string) => string) => string;
export const toPlainText: (str: string) => string;
export const escapeCSS: (text: string, urlTransform: (url: string, element: string) => string) => string;
