import { LightningElement, api } from 'lwc';

// https://developer.salesforce.com/blogs/2019/04/lightning-web-components-in-lightning-communities
export default class HelloWorld extends LightningElement {
@api buttonText = "Click Me";

    handleClick() {
      console.log("Button Clicked!");
      alert("Button Clicked!");
    }

}