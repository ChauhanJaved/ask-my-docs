// This file will be served as a static JS asset
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getWidgetLoaderScript = (orgId: string, widgetUrl: string) => `
  (function() {
    const script = document.createElement('script');
    script.src = '\${widgetUrl}/api/widget/embed?orgId=\${orgId}';
    script.defer = true;
    document.body.appendChild(script);
  })();
`;