export default function ReelManagement() {
  // Component logic would go here

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      
      {/* Type Dialog - Enhanced */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[95vw] h-auto max-h-[90vh] mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setShowTypeDialog(false)} 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base border-gray-300 hover:bg-gray-50 rounded-lg order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingType ? handleUpdateType : handleCreateType}
                className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 order-1 sm:order-2"
                disabled={!typeForm.category_id || !typeForm.name || !typeForm.title}
              >
                {editingType ? 'Update Type' : 'Create Type'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
