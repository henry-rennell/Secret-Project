//the postgreSQL database for this web app contains a table "gigs", which contains a number of columns pertaining to a posted gig.

//it also contains a table "users" 

//a join Query can be used on the two tables for the column "username" which is unique for "users" but is not for gigs such that multiple gigs will be returned when searching for gigs posted by the same username

//multer is used to facilitate file storage and transfer on this server.

//example route for creating a new post in the database and adding images to s3 database.
//uploads a new gig to db and s3
router.post('/gigs', upload.single('image'), async (req, res) => {
    //generating gig_id based on time posted and randomly generated 4 digit code. This was done in order to maximize scalability and avoid multiple gigs under the same gig_id
    const gig_id = (Date.now().toString() + generateRandomCode()).toString();

    let image = req.file;
    let imagePath = image.path
    const data = req.body
     //calling S3 function to upload image to bucket
    let result =  await uploadFile(image, gig_id, data.username);  

    //query to add data to database and return gig_id in order for the front end to navigate to the newly posted gig
    const sqlInsertQuery = `
    INSERT INTO gigs 
    (title, description, city, address, artist, date, start_time, keywords, username, gig_id)
    VALUES
    ($1, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING gig_id;
    `
    //sending query to the database
    pool.query(sqlInsertQuery, [data.title, image_key, data.description, data.city, data.address, data.artist, data.date, data.start_time, data.keywords, data.username, gig_id], (err, dbRes) => {
        if (err) console.log(err)

        
        //deleting temporarily stored image
        fs.unlink(imagePath, ((unlinkErr) => {
            if (unlinkErr) console.log(unlinkErr)
        }))
    //sending the returned gig_id to the front end.
        return res.send(dbRes.rows[0])
    })

})

//get gigs based on user interests,

/* 

This route is designed to facilitate a section of the app dedicated to finding upcoming events based genres and interests determined by the user on creation of their account

*/
router.get('/gigs/interests/:username', async (req, res) => {
    const username = req.params.username;

    //returning the interests of the user in order to make another query for gigs based on those interests
    const sql = `select interests from users where username = $1;`
    
    pool.query(sql, [username], (err, dbRes) => {
        if(err) console.log(err, 'first query')

        let interests = (dbRes.rows[0].interests);

        //sql statement to return gigs where at least 1 of the keywords matches 1 of the users interests
        let sql = `SELECT *
        FROM gigs
        WHERE EXISTS (
            SELECT 1
            FROM unnest(keywords) AS gig_keyword
            WHERE gig_keyword = ANY(array[$1, $2, $3, $4, $5])
        );
        `
        
        //incase the user has less than the maximum 5 interests
        if (interests.length < 5) {
            for(let i = 0; i < 5 - interests.length; i++) {
                interests.push('');
            }
        }
        
        //second query, each value in the users interests array is being sanitised to make sure there is no injection possible, (it looks clunky but is very functional) returns all of the gigs with overlap in the users interests
        pool.query(sql, [interests[0], interests[1], interests[2], interests[3], interests[4]], (err, result) => {
            if(err) console.log(err)
            //returning the result
            res.send(result.rows)
        })
    })

})