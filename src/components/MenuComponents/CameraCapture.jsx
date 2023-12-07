import React, { useState, useEffect, useRef, useContext } from 'react';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AppContext from '../../api/services/AppContext';

import { convertDataURLToBlob } from '../../api/services/Utilities';

import './CameraCapture.css'

const CameraCapture = () => {
    const [stream, setStream] = useState(null);
    const [photoTaken, setPhotoTaken] = useState(false);
    const [photoSrc, setPhotoSrc] = useState('');
    const videoRef = useRef(null);
    const photoRef = useRef(null);
    const menuID = useRef(null);

    const {businessUID} = useContext(AppContext);
  
    const initializeCamera = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(currentStream);
            if (videoRef.current) {
                videoRef.current.srcObject = currentStream;
            }
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    };

    useEffect(() => {
       initializeCamera();
        // Clean up
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);


    const takePhoto = () => {
        // Capture the current image frame
        const video = videoRef.current;
        const photo = photoRef.current;
        const context = photo.getContext('2d');

        if (video && photo) {
            const width = video.videoWidth;
            const height = video.videoHeight;
            
            photo.width = width;
            photo.height = height;
            
            context.drawImage(video, 0, 0, width, height);

            // Get data URL of the photo
            const photoDataURL = photo.toDataURL('image/png');  //Inline data base64??
            setPhotoSrc(photoDataURL);
            setPhotoTaken(true);
        }
        setPhotoTaken(true);
    };

    const uploadImage = async () => {
        const dataURL = photoSrc //
        const blob = convertDataURLToBlob(dataURL);  // Data must be passed as blob to fastAPI.
        const file = new File([blob], 'upload.png', { type: 'image/png' });
      
        const formData = new FormData();
        formData.append('business_uid', businessUID);
        formData.append('file', file);
      
        try {
            const response = await fetch(`${process.env.REACT_APP_LLM_ENDPOINT}/menus/upload/`, {
                method: 'POST',
                body: formData
            });
    
            const data = await response.json();
            console.log(data);
    
            if (data.menu_id) {
                menuID.current = data.menu_id;
                return true;  // Return true if the operation is successful
            } else {
                return false; // Return false if the operation is unsuccessful
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            return false;  // Return false in case of error
        }
    };
    
    const handleKeepPhoto = async() => {
        console.log('Photo kept');
        //Send image to database server. Sets menuID if successful.
        uploadImage()
        .then ( data =>{
            debugger;
             if (data && menuID.current){
                doOCR(businessUID, menuID.current);
            }
        })
    }

    const doOCR = async () => {
        // Perform OCR on image.
        debugger;
        try {
            const response = await fetch (`${process.env.REACT_APP_LLM_ENDPOINT}/menus/ocr/${businessUID}/${menuID.current}`);
            const { status, message } = await response.json();
            if (status === "success"){
                console.log('Successfully extract text for image:', menuID.current);
            }
            else {
                console.error('Error performing OCR for image:',menuID.current, message);
            }
        }
        catch(error) {
            console.error('Error performing OCR for image:',menuID.current, error);
        }
    }

    const handleRejectPhoto = () => {
        setPhotoTaken(false);
        setPhotoSrc('');
        initializeCamera(); // Restart the camera
    };

    return (
        <div className="camera-container">
        {!photoTaken ? (
            <div className='video-frame'>
                <video ref={videoRef} autoPlay playsInline className="video-stream"></video>
                <div className="controls">
                    <IconButton color="primary" aria-label="take photo" component="span" onClick={takePhoto}  sx = {{ 
                          backgroundColor: '#FFFFFF', 
                          '&:hover':{
                            backgroundColor: 'lightgray'
                          }
                        }}>
                        <PhotoCamera fontSize="large" />
                    </IconButton>
                </div>
            </div>
        ) : (
            // Render the taken photo and action buttons
            <>
                <img src={photoSrc} alt="Captured" className="captured-image" />
                <div className="photo-actions">
                    <IconButton color="primary" aria-label="keep photo" component="span" onClick={handleKeepPhoto}  sx = {{ 
                          backgroundColor: '#FFFFFF', 
                          '&:hover':{
                            backgroundColor: 'lightgray'
                          }
                        }}>
                        <CheckIcon fontSize="large" />
                    </IconButton>
                    <IconButton color="secondary" aria-label="reject photo" component="span" onClick={handleRejectPhoto}  sx = {{ 
                          backgroundColor: '#FFFFFF', 
                          '&:hover':{
                            backgroundColor: 'lightgray'
                          }
                        }}>
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
            </>
        )}
        <canvas ref={photoRef} style={{ display: 'none' }}></canvas>
    </div>
    );
};

export default CameraCapture;