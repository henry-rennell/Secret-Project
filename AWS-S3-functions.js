//These functions are used with a NodeJs API and control the S3 bucket used to store images for a full stack Web Application.

//The bucket is organised into psudeo directories that organise the stored images associated with each post under users/example_user/posts/example_post 

//This function is called by the NodeJs API in order to upload an image to an s3 bucket.
async function uploadFile(file, gig_id, username) {
    //creating Read stream in order to transfer the image
    const fileStream = fs.createReadStream(file.path);

    //Key acts as the reference to the object uploaded to the s3 bucket.
    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: `users/${username}/posts/${gig_id}/${file.filename}`
    }

    return s3.upload(uploadParams).promise();

}

//this function is called by the API to retreive Presigned URLs for multiple files stored under the given path in an S3 bucket.
async function getAllImages(path) {
    //setting parameters for listObjects call
    const params = {
        Bucket: bucketName,
        Prefix: path,
    };
    //waiting for s3ListObject call to return data
    const data = await s3.listObjectsV2(params).promise();

    /*
    The returned data has an array of objects named Contents, each object in the directory has an object with a "Key" value, we use this to generate presigned Urls,
    */
    const presignedUrlsPromises = data.Contents.map((image) => {
        const params = {
            Bucket: bucketName,
            Key: image.Key,
            Expires: 3600,
        };

        return s3.getSignedUrl('getObject', params);
    });

    //awaiting each of the keys in data.Contents to be assigned a presigned url
    const presignedUrls = await Promise.all(presignedUrlsPromises);

    //returning presigned Urls
    return presignedUrls;
}

//This function will delete all objects within a given S3 path, My project uses this when a user deletes a post, (and subsequently all of the images associated with it.)
async function deleteImages(path) {
    //Prefix specifies a path for line 58 to search within and return all objects within
    const params = {
        Bucket: bucketName,
        Prefix: path,
    }
    let result = await s3.listObjectsV2(params).promise();

    //all objects returned are then mapped into an array of only their Keys
    const objectsToDelete = result.Contents.map(object => ({
        Key: object.Key,
    }))

    //this line then deletes each of the specified objects.
    let call = await s3.deleteObjects({
        Bucket: bucketName, 
        Delete: {Objects: objectsToDelete}
    }).promise();

    return call;
}
