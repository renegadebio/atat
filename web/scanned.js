module.exports = (ctx) => (req, resp) => {
    resp.status(200)
        .send(`<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>Item # ${req.id}</title>
<style>
dt {
    margin-top: 2rem;
    font-weight: 600;
}
</style>
</head>
<body style="font-family: helvetica, sans-serif;">

<div style="margin: auto; max-width: 300px;">

    <div style="text-align:center; margin: 2rem 0 2rem 0; font-size:1.3rem;">Item #</div>

    <h1 style="text-align:center;">${req.params.id}</h1>

    <blockquote style="margin-top: 2rem;">
        <dl>
            <dt>City</dt>
            <dd>${req.headers["x-appengine-city"]}</dd>

            <dt>Region</dt>
            <dd>${req.headers["x-appengine-region"]}</dd>
        </dl>
    </blockquote>
</div>
</body>
</html>`)
}
