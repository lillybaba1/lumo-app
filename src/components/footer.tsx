export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Lumo. All rights reserved.</p>
      </div>
    </footer>
  );
}
