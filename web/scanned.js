module.exports = (ctx) => (req, resp) => {
    resp.status(200)
        .send(`<html>
<title>Item # ${req.id}</title>
<body>
<h1>Cool!</h1>

<p>You've scanned item # ${req.params.id}</p>

<p>Here's where google thinks you are:</p>

<blockquote>
    <dl>
        <dt>City</dt>
        <dd>${req.headers["x-appengine-city"]}</dd>

        <dt>Region</dt>
        <dd>${req.headers["x-appengine-region"]}</dd>
    </dl>
</blockquote>
</body>
</html>`)
}
