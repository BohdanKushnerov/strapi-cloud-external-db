

module.exports = {
  // beforeUpdate: async (event) => {
  //   console.log("555", event);
  // },
  lifecycles: {
    async afterCreate(event) {
      const { result, params } = event;
      console.log("lifecycles clg");
    },
  },
};

// export default {
//   // beforeCreate(event) {
//   //   const { data, where, select, populate } = event.params;
//   //   console.log(1111111111);

//   //   // let's do a 20% discount everytime
//   //   event.params.data.price = event.params.data.price * 0.8;
//   // },
//   beforeUpdate(event) {
//     const { data, where, select, populate } = event.params;

//     console.log(data, where, select, populate);
//     console.log(333333333333);

//     // let's do a 20% discount everytime
//     // event.params.data.price = event.params.data.price * 0.8;
//   },

//   // afterCreate(event) {
//   //   const { result, params } = event;

//   //   console.log(2222222222);
//   //   // do something to the result;
//   // },
// };
