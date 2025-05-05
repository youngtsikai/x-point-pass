import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagViewsComponent } from './flag-views.component';

describe('FlagViewsComponent', () => {
  let component: FlagViewsComponent;
  let fixture: ComponentFixture<FlagViewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlagViewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlagViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
