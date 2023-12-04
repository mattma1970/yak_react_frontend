export const getLastResponse = async (session_id) =>{
    // Get the last model response in the agents conversation memory.
    let last_response = '';
    const URL = `${process.env.REACT_APP_LLM_ENDPOINT}/get_last_response/${session_id}`;
    
    try {
        const response = await fetch(URL); //GET
        const ret = await response.json(); 
        last_response = ret['last'];
    }
    catch(e){
        console.log(`Error getting last message for ${session_id}`);
    };
    return last_response;
    }


export const convertDataURLToBlob = (dataURL) => {
    /*
        Convert base64 data in a DataURL (created using a .toDataURL) to a blob object suitable to sending to fastAPI/
        If the image is rendered in the <img> tag from a Data URL object created using the .toDataURL() method, you
        do indeed still need to convert it to a Blob before sending it to your FastAPI endpoint. The reason for this is 
        that the image data needs to be sent as a file-like object in a multipart/form-data request, and a Data URL is 
        essentially a base64-encoded string, not a file object.
    */
        const byteString = atob(dataURL.split(',')[1]);
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        const byteNumbers = new Array(byteString.length);
      
        for (let i = 0; i < byteString.length; i++) {
          byteNumbers[i] = byteString.charCodeAt(i);
        }
      
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeString });
      };