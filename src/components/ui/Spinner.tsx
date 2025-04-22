function Spinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cozy-background to-white">
          <div className="flex flex-col items-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-lg font-medium text-cozy-foreground">
              Loading...
            </p>
          </div>
        </div>
      );
}

export default Spinner