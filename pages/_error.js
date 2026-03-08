function Error({ statusCode }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
      <h1>{statusCode ? `An error ${statusCode} occurred` : "An error occurred"}</h1>
      <a href="/">Go home</a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
