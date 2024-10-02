export default ({ env }) => ({
  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
        introspection: true,
      },
    },
  },
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {
          folder: "your-folder-name",
          format: "avif",
        },
        uploadStream: {
          folder: "your-folder-name",
        },
        delete: {
          folder: "your-folder-name",
        },
      },
    },
  },
});
